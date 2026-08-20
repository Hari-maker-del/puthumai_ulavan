# Local Verification — Final Candidate

Use Node 20 LTS for the most predictable environment (`.nvmrc` is included).

From the project root:

```powershell
npm ci
npm run quality:final
```

The quality gate runs:
- production audit
- real-data-only audit
- RLS static audit
- TypeScript
- ESLint on `src/`
- Vite production build

Source-level verification completed on this candidate:
- production audit: PASS
- real-data audit: PASS
- RLS static audit: PASS (9 migrations)
- TypeScript: PASS
- ESLint: PASS with 14 non-blocking warnings

The final Vite build must be run on the target Windows machine after `npm ci`
so npm installs the correct platform-specific Rollup binary.

Do not use `npm audit fix --force`.
