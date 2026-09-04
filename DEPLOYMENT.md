# Puthumai Uzhavan — Deployment Guide

## Prerequisites

- Node.js 20 (see `.nvmrc`)
- A Supabase project (free tier is fine)
- A Vercel account
- A Google Gemini API key (from Google AI Studio)

---

## 1. Supabase Setup

Apply the migrations in order from the Supabase SQL Editor:

```
supabase/migrations/000_base_farmer_schema.sql
supabase/migrations/001_yield_predictions.sql
supabase/migrations/002_fields_realtime.sql
supabase/migrations/003_market_prices_state.sql
supabase/migrations/20260901_marketplace_orders.sql
supabase/migrations/20260901_admin_overview_rpc.sql
```

Enable **Realtime** for these tables in the Supabase dashboard:
`farms`, `crops`, `expenses`, `farmer_alerts`, `recommendations`, `fields`

---

## 2. Environment Variables

### Vercel (server-side — set in Vercel dashboard, NOT in .env)
| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key — **never use VITE_ prefix** |
| `GEMINI_MODEL` | Model name, e.g. `gemini-2.5-flash` (optional, has default) |
| `SUPABASE_URL` | Same URL as `VITE_SUPABASE_URL` — used by the API proxy for JWT verification |
| `SUPABASE_ANON_KEY` | Same key as `VITE_SUPABASE_ANON_KEY` |

### .env file (client-side — safe to expose, Supabase anon key is public by design)
Copy `.env.example` to `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DATA_GOV_API_KEY=        # optional — for live mandi prices
VITE_USE_MOCK=false
```

---

## 3. Deploy to Vercel

```bash
npm ci
npm run build       # verify the build passes locally first
vercel --prod       # or push to main if connected via GitHub
```

The `vercel.json` already configures:
- SPA routing (all non-API routes → index.html)
- Security headers (CSP, X-Frame-Options, etc.)
- Asset caching (1 year for /assets/*)
- Gemini proxy timeout (30s)

---

## 4. Post-Deploy Verification

1. Visit your Vercel URL and confirm the landing page loads
2. Register a new farmer account
3. Verify email, then log in
4. Create a farm and at least one field
5. Go to **Crop Recommendation** and confirm Gemini AI responds (check DevTools → Network → /api/gemini)
6. Go to **Weather** and confirm live weather loads
7. Check the **Marketplace** — create a listing and place an order

---

## Architecture Notes

- **Gemini API key** is server-side only. All AI calls go through `/api/gemini` (Vercel serverless function). The key is never in the JS bundle.
- **Supabase anon key** is intentionally public — access is controlled by Row Level Security policies in the database.
- **Real-time** uses Supabase Postgres Changes subscriptions, scoped to the authenticated user.
- **Offline support** — read-only data is cached by the axios interceptor in `offlineFetch.ts`.
