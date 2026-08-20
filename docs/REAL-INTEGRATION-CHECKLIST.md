# Real Integration Checklist

## OpenWeather
Configure `OPENWEATHER_API_KEY` in Vercel. Test valid key, invalid key, offline/network failure, cached response and empty/unavailable state.

## Gemini
Configure `VITE_GEMINI_API_KEY`. Test normal prompt, invalid key, quota/429 and network failure. Never expose the key in source.

## Supabase
Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Apply migrations 001→005. Configure production auth callback and run the two-user RLS plan.

## Market/Government data
Only label values LIVE when the app actually received them from a verified source. Empty data must be an honest empty state; estimates/demo data must be labelled.
