# Puthumai Uzhavan — Live Dashboard Data Fixes

## Dashboard behavior

The Farm Command Center now reads:

- live weather from Open-Meteo, using the farmer's saved farm location;
- daily mandi prices from the Government of India's data.gov.in / AGMARKNET resource when `VITE_DATA_GOV_API_KEY` is configured;
- otherwise only verified Supabase `market_prices` records are used;
- AI briefing from Gemini using the assembled live farm context.

There is no silent mock-data fallback in the production dashboard.

## Vercel environment variables

Set these in the Vercel project under **Settings → Environment Variables** and redeploy:

```text
VITE_SUPABASE_URL=<your Supabase project URL>
VITE_SUPABASE_ANON_KEY=<your Supabase anon/publishable key>
GEMINI_API_KEY=<valid Gemini API key> (Vercel server environment only)
GEMINI_MODEL=gemini-2.5-flash
VITE_DATA_GOV_API_KEY=<your data.gov.in API key>
VITE_USE_MOCK=false
```

Open-Meteo does not require a browser API key for non-commercial use, so the old `VITE_OPENWEATHER_API_KEY` is no longer needed for dashboard weather.

## Important 401 diagnosis

If Gemini returns HTTP 401, the code is correctly reporting an invalid/missing Gemini credential; replace the `GEMINI_API_KEY` value in Vercel and redeploy.

If data.gov.in returns HTTP 401/403, replace `VITE_DATA_GOV_API_KEY` with a valid key from the OGD portal.

## Farm hierarchy

The database architecture is:

```text
Farmer (auth.users)
  └── farms.user_id
        └── fields.farm_id
```

Fields are authorized through their parent farm. The migration is:

`supabase/migrations/20260901_farm_field_hierarchy.sql`

Run the migrations in Supabase SQL Editor / migration workflow before using field CRUD against a database that does not already have the new `farm_id` relationship.
