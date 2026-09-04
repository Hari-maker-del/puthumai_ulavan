# Dependency Status

Current project dependency choices are preserved from the latest Copilot working tree.
Do not perform a forced major Vite upgrade as part of this release.

Before release, run:
- npm ci
- npm run quality:final
- npm audit

If Vite/esbuild vulnerabilities remain, evaluate a controlled Vite major upgrade separately
with a staging regression test. Do not use `npm audit fix --force`.
