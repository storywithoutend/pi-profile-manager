# pi-profile-manager

A [pi-coding-agent](https://pi.dev) extension for managing named configuration profiles.

## Features

- **Save profiles** — Capture your current tool selection as a named profile
- **Switch profiles** — Quickly swap between different tool sets or configurations
- **Session-persistent** — Profiles survive session reloads and tree navigation

## Installation

### From source (local)

```bash
git clone https://github.com/storywithoutend/pi-profile-manager.git
cd pi-profile-manager
pi install .
```

### From GitHub

```bash
pi install git:github.com/storywithoutend/pi-profile-manager
```

## Usage

### Via Commands

| Command | Description |
|---------|-------------|
| `/profiles` | List all saved profiles |
| `/profiles create <name>` | Save current settings as a profile |
| `/profiles switch <name>` | Activate a profile |
| `/profiles delete <name>` | Delete a profile |

### Via Tool

The model can also use the `profile_manager` tool directly:

- `action: "list"` — List all profiles
- `action: "create"` + `name` — Create a new profile
- `action: "switch"` + `name` — Switch to a profile
- `action: "delete"` + `name` — Delete a profile

## Development

This extension is written in TypeScript and uses the `pi-coding-agent` extension API.

No build step is required — pi uses [jiti](https://github.com/unjs/jiti) to load TypeScript directly.

## License

MIT
