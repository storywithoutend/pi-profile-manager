/**
 * Pi Profile Manager Extension
 *
 * Manages named configuration profiles for pi-coding-agent sessions.
 * Profiles can store model preferences, thinking levels, and active tools.
 *
 * Usage:
 *   /profile create <name>    - Save current settings as a profile
 *   /profiles                 - List all saved profiles
 *   /profile switch <name>    - Switch to a profile
 *   /profile delete <name>    - Delete a profile
 */

import { Type } from "typebox";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

// Profile shape
interface Profile {
  name: string;
  model?: string;
  thinking?: string;
  tools?: string[];
  createdAt: number;
}

// State persisted to session
interface ProfileState {
  profiles: Profile[];
  activeProfile?: string;
}

export default function profileManagerExtension(pi: ExtensionAPI) {
  // In-memory store
  let state: ProfileState = { profiles: [], activeProfile: undefined };

  // Persist current state to session
  function persistState() {
    pi.appendEntry<ProfileState>("profile-manager-state", { ...state });
  }

  // Restore state from session entries (walk branch to find latest)
  function restoreState(ctx: ExtensionContext) {
    const branchEntries = ctx.sessionManager.getBranch();
    for (const entry of branchEntries) {
      if (entry.type === "custom" && entry.customType === "profile-manager-state") {
        const data = entry.data as ProfileState | undefined;
        if (data) {
          state = { ...data };
        }
      }
    }
  }

  // ── Custom Tool ──
  pi.registerTool({
    name: "profile_manager",
    label: "Profile Manager",
    description: "Manage pi configuration profiles: list, create, switch, or delete profiles",
    promptSnippet: "Save, restore, or list named pi configuration profiles",
    parameters: Type.Object({
      action: Type.String({
        description: "Action to perform: 'list', 'create', 'switch', or 'delete'",
      }),
      name: Type.Optional(Type.String({ description: "Profile name (required for create, switch, delete)" })),
    }),

    async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
      const { action, name } = params;

      switch (action) {
        case "list": {
          if (state.profiles.length === 0) {
            return {
              content: [{ type: "text", text: "No profiles saved yet." }],
              details: { profiles: [] },
            };
          }
          const lines = state.profiles.map((p) => {
            const marker = p.name === state.activeProfile ? " (active)" : "";
            return `- ${p.name}${marker}`;
          });
          return {
            content: [{ type: "text", text: `Profiles:\n${lines.join("\n")}` }],
            details: { profiles: state.profiles, activeProfile: state.activeProfile },
          };
        }

        case "create": {
          if (!name) {
            throw new Error("Profile name is required for 'create'.");
          }
          const existing = state.profiles.find((p) => p.name === name);
          if (existing) {
            throw new Error(`Profile '${name}' already exists.`);
          }
          // Capture current settings
          const allTools = pi.getAllTools().map((t) => t.name);
          const activeTools = pi.getActiveTools();
          const profile: Profile = {
            name,
            tools: activeTools.length > 0 ? activeTools : allTools,
            createdAt: Date.now(),
          };
          state.profiles.push(profile);
          state.activeProfile = name;
          persistState();
          return {
            content: [{ type: "text", text: `Profile '${name}' created and activated.` }],
            details: { profile },
          };
        }

        case "switch": {
          if (!name) {
            throw new Error("Profile name is required for 'switch'.");
          }
          const profile = state.profiles.find((p) => p.name === name);
          if (!profile) {
            throw new Error(`Profile '${name}' not found.`);
          }
          // Activate tools from profile
          if (profile.tools && profile.tools.length > 0) {
            pi.setActiveTools(profile.tools);
          }
          state.activeProfile = name;
          persistState();
          return {
            content: [{ type: "text", text: `Switched to profile '${name}'.` }],
            details: { profile },
          };
        }

        case "delete": {
          if (!name) {
            throw new Error("Profile name is required for 'delete'.");
          }
          const idx = state.profiles.findIndex((p) => p.name === name);
          if (idx === -1) {
            throw new Error(`Profile '${name}' not found.`);
          }
          state.profiles.splice(idx, 1);
          if (state.activeProfile === name) {
            state.activeProfile = undefined;
          }
          persistState();
          return {
            content: [{ type: "text", text: `Profile '${name}' deleted.` }],
            details: { profiles: state.profiles },
          };
        }

        default: {
          throw new Error(`Unknown action '${action}'. Use list, create, switch, or delete.`);
        }
      }
    },
  });

  // ── Commands ──

  // /profiles — list all profiles (plural = multiple objects)
  pi.registerCommand("profiles", {
    description: "List all saved configuration profiles",
    handler: async (_args, ctx) => {
      restoreState(ctx);
      if (state.profiles.length === 0) {
        ctx.ui.notify("No profiles saved yet.", "info");
        return;
      }
      const lines = state.profiles.map((p) => {
        const marker = p.name === state.activeProfile ? " (active)" : "";
        return `${p.name}${marker}`;
      });
      ctx.ui.notify(`Profiles: ${lines.join(", ")}`, "info");
    },
  });

  // /profile — actions on a single profile object (singular)
  pi.registerCommand("profile", {
    description: "Create, switch, or delete a configuration profile",
    handler: async (args, ctx) => {
      const [subcmd, name] = args.trim().split(/\s+/);
      restoreState(ctx);

      switch (subcmd) {
        case "create": {
          if (!name) {
            ctx.ui.notify("Usage: /profile create <name>", "error");
            return;
          }
          const existing = state.profiles.find((p) => p.name === name);
          if (existing) {
            ctx.ui.notify(`Profile '${name}' already exists.`, "error");
            return;
          }
          const allTools = pi.getAllTools().map((t) => t.name);
          const activeTools = pi.getActiveTools();
          const profile: Profile = {
            name,
            tools: activeTools.length > 0 ? activeTools : allTools,
            createdAt: Date.now(),
          };
          state.profiles.push(profile);
          state.activeProfile = name;
          persistState();
          ctx.ui.notify(`Profile '${name}' created and activated.`, "info");
          break;
        }

        case "switch": {
          if (!name) {
            ctx.ui.notify("Usage: /profile switch <name>", "error");
            return;
          }
          const profile = state.profiles.find((p) => p.name === name);
          if (!profile) {
            ctx.ui.notify(`Profile '${name}' not found.`, "error");
            return;
          }
          if (profile.tools && profile.tools.length > 0) {
            pi.setActiveTools(profile.tools);
          }
          state.activeProfile = name;
          persistState();
          ctx.ui.notify(`Switched to profile '${name}'.`, "info");
          break;
        }

        case "delete": {
          if (!name) {
            ctx.ui.notify("Usage: /profile delete <name>", "error");
            return;
          }
          const idx = state.profiles.findIndex((p) => p.name === name);
          if (idx === -1) {
            ctx.ui.notify(`Profile '${name}' not found.`, "error");
            return;
          }
          const ok = await ctx.ui.confirm("Delete profile", `Delete '${name}'?`);
          if (!ok) {
            ctx.ui.notify("Cancelled.", "info");
            return;
          }
          state.profiles.splice(idx, 1);
          if (state.activeProfile === name) {
            state.activeProfile = undefined;
          }
          persistState();
          ctx.ui.notify(`Profile '${name}' deleted.`, "info");
          break;
        }

        default: {
          ctx.ui.notify(`Unknown subcommand: ${subcmd}. Use create, switch, or delete.`, "error");
        }
      }
    },
  });

  // ── Event Handlers ──
  pi.on("session_start", async (_event, ctx) => {
    restoreState(ctx);
  });

  pi.on("session_tree", async (_event, ctx) => {
    restoreState(ctx);
  });

  pi.on("resources_discover", async (_event, _ctx) => {
    // Optional: contribute additional resources here
    return {};
  });
}
