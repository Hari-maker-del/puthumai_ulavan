# Local verification

`node_modules` is intentionally created by `npm ci` and must NOT be treated as
a release-artifact failure during local verification. The production audit now
ignores it while still ignoring `.env`, `.git`, and `dist` release artifacts.

Run:

```powershell
npm run quality:final
```

The npm audit vulnerability report is separate from TypeScript/build errors.
Do not run `npm audit fix --force` before reviewing the dependency tree because
it can introduce breaking upgrades. After the build passes, run:

```powershell
npm audit
```

and review the affected packages.
