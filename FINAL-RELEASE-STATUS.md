# Puthumai Uzhavan — Final Production Candidate

This release includes the complete production hardening layer:
authentication callback, data provenance, explainable AI, Farm Digital Twin,
outcome feedback, offline conflict foundation, bounded retries, production
quality gates, mobile/accessibility/performance requirements, and CI.

Run locally:

```powershell
npm ci
npm run production:final
npm run typecheck
npm run lint
npm run build
```

Then complete `tests/production/production-test-matrix.md` against the real
Supabase, Vercel, Gemini, OpenWeather and Android environment.

No codebase can honestly mark those real-environment tests as passed without
access to the actual services.
