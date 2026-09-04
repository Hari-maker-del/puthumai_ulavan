# Puthumai Uzhavan — Phase 1

## Completed
- Dashboard reads authenticated farmer data directly from Supabase instead of the legacy `/dashboard` API.
- Dashboard finance uses recorded `farm_sales` and `expenses`; no hard-coded budget or revenue values.
- Weather uses live Open-Meteo with no OpenWeather key requirement in the browser.
- Market intelligence uses AGMARKNET/data.gov.in when configured and verified Supabase market records otherwise; unverified records are excluded.
- AI crop recommendation is farm-context aware and uses live weather/verified market context when available. It does not invent market prices.
- Yield prediction is an explicitly labelled Gemini farm-aware estimator, saved to `yield_predictions`; it does not claim to be a trained ML model.
- Scanner uses Gemini vision only and fails clearly when AI is not configured; no mock scan fallback.
- Farm → fields ownership is enforced through `farm_id` and farmer ownership/RLS.
- Phase-1 migration hardens fields ownership, RLS and realtime publication.

## Verification
- TypeScript: PASS (`tsc --noEmit`)
- Real-data audit: PASS
- Core farm requirements audit: PASS
- RLS static audit: PASS
- Full network/API verification was not possible in this offline build environment.
- ESLint/build could not be executed because the local dependency installation was incomplete; no source-level TypeScript errors were reported.

## Still intentionally not claimed as complete
A custom trained agricultural ML model is not included. Adding one requires a real labelled agricultural dataset and a reproducible training/evaluation pipeline. Gemini inference is not presented as a trained custom model.
