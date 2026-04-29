# Agent Workflow

## Post-Change Validation Workflow

After any code changes are made to TypeScript files in this project, run the following linting and validation commands to ensure type safety and code correctness.

### 1. TypeScript Type Checking

Run the TypeScript compiler in no-emit mode to validate all `.ts` files without generating output:

```bash
npx tsc --noEmit
```

This checks for:
- Type errors
- Missing imports or exports
- Incorrect type annotations
- Syntax errors

### What to Do If Validation Fails

1. **Read the error output** carefully to identify the failing file(s) and line number(s)
2. **Fix all reported errors** before proceeding
3. **Re-run the validation command** to confirm everything passes:
   ```bash
   npx tsc --noEmit
   ```

### Notes

- The `tsconfig.json` is configured with `noEmit: true`, so `npx tsc` alone also works
- The compiler checks all files matched by `"src/**/*.ts"` in `tsconfig.json`
- Strict mode is enabled — all type errors must be resolved
