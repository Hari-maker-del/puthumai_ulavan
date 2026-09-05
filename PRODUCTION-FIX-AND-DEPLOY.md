# Puthumai Uzhavan — Production Fix & Deployment

## What this release fixes

- Vercel function configuration no longer contains an unmatched `api/gemini.js` override.
- The Crop Recommendation page imports `useEffect` correctly.
- The Farm Profile page no longer references undefined runtime variables.
- The service worker cache is bumped to v2 and registration bypasses stale HTTP cache.
- Gemini server configuration failures return a clear 503 instead of an internal 500.
- `.env` is ignored and is not part of the release archive.

## Required Supabase step

The browser errors showing `404 (Not Found)` for `fields`, `farm_tasks`, `farm_sales`, `yield_predictions`, `ai_conversations`, `market_prices`, `marketplace_listings`, and `marketplace_orders` mean the live Supabase project does not yet have the schema expected by this release.

Open the Supabase SQL Editor for the same project used by `VITE_SUPABASE_URL` and run:

`supabase/PRODUCTION-APPLY-ALL.sql`

Run it as one SQL script. It is assembled from the repository migrations in dependency order. Do not paste any `.env` values into SQL.

## Required Vercel environment variables

Set these for **Production** in Vercel:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `GEMINI_API_KEY`
- `GEMINI_MODEL` = `gemini-2.5-flash` (optional; this is already the server default)

Optional:

- `VITE_DATA_GOV_API_KEY`

Never use a `VITE_` prefix for `GEMINI_API_KEY`. Never commit `.env`.

## Local verification

```powershell
npm install
npm run typecheck
npm run lint
npm run build
```

Then commit and push:

```powershell
git add .
git commit -m "Fix production runtime and deployment issues"
git push origin main
```

After deployment, hard-refresh the site once (`Ctrl+Shift+R`). The service-worker version bump will replace the old cached app shell.
