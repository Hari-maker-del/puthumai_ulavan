# Final Production Upgrade

## Completed in this release

- Weather uses same-origin `/api/weather` in production.
- `OPENWEATHER_API_KEY` is server-side; it is never required as a `VITE_*` production variable.
- OpenWeather is preferred and Open-Meteo is a real-data fallback.
- `/api/*` is excluded from the SPA catch-all rewrite so Vercel Functions remain reachable.
- Weather query validation rejects malformed coordinates and oversized location strings.
- Weather responses are schema-checked before entering the farmer UI.
- Gemini legacy `gemini-2.0-flash` configuration is automatically migrated to `gemini-3.6-flash`.
- The supplied Puthumai Uzhavan logo is preserved exactly.
- Production/security headers and immutable asset caching are configured.
- Vite build output is split into vendor, React, Supabase, Gemini, and chart chunks.
- A live production smoke test is available.
- Static production, real-data, and RLS audits remain available.

## Dependency security gate

The checked-in lockfile still contains `esbuild@0.21.5`. This release intentionally does **not** fabricate a new lockfile without registry access.

Before the final production release, run on a networked machine:

```powershell
npm install
npm audit
npm audit fix
npm run typecheck
npm run lint
npm run build
```

Then run:

```powershell
npm run dependency:review
npm run production:verify
```

Do not use `npm audit fix --force` without reviewing the resulting major-version changes.

## Live acceptance gate

Set the production URL and run:

```powershell
$env:PRODUCTION_URL="https://puthumai-ulavan.vercel.app"
npm run live:smoke
```

Then manually verify:

1. Signup -> verification email -> callback -> dashboard.
2. Two-user Supabase RLS isolation.
3. Gemini chat.
4. Weather current conditions and forecast.
5. Realtime update from two browser sessions.
6. Empty-state behavior for a brand-new farmer.
7. Mobile camera/microphone permissions where applicable.
8. Logout/login persistence.

A static audit cannot prove those live behaviors.

## Logo integrity

The supplied production logo is stored at `public/assets/image.png` with SHA-256 `0d4ac011fe919793f6791f134dcffbe6c9f85949534be0e5d8ffccfa0a6c183e`.
