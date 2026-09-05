# Puthumai Uzhavan — Production Deployment Guide

## Prerequisites

- Node.js 22 (see .nvmrc)
- A Supabase project (free tier works)
- A Vercel account (free tier works)
- A Google AI Studio API key for Gemini
- (Optional) An OpenWeatherMap API key

---

## Step 1: Apply Database Migrations

Open your Supabase project → SQL Editor.
Run each migration file **in order**:

```
supabase/migrations/000_base_farmer_schema.sql
supabase/migrations/001_farmer_memory_and_alerts.sql
supabase/migrations/002_ai_conversation_threads.sql
supabase/migrations/003_market_prices.sql
supabase/migrations/004_market_verification.sql
supabase/migrations/005_production_data_integrity.sql
supabase/migrations/20260817_real_farmer_rls_gate.sql
supabase/migrations/20260817_realtime_farmer_tables.sql
supabase/migrations/20260818_production_rls_owner_gate.sql
supabase/migrations/20260824_notification_preferences.sql
supabase/migrations/20260825_core_farm_operations.sql
supabase/migrations/20260825_farm_operations_rls.sql
supabase/migrations/20260830_farmer_memory_schema_refresh.sql
supabase/migrations/20260901_admin_overview.sql
supabase/migrations/20260901_farm_field_hierarchy.sql
supabase/migrations/20260901_marketplace_orders.sql
supabase/migrations/20260901_phase1_hardening.sql
supabase/migrations/20260902_avatars_storage.sql
supabase/migrations/realtime_tables.sql
```

All migrations are idempotent (use `CREATE TABLE IF NOT EXISTS`, `CREATE POLICY IF NOT EXISTS`, etc.).
It is safe to run them on a fresh project.

After applying migrations, enable **Realtime** for these tables in
Supabase Dashboard → Database → Replication:
- farms
- expenses
- crops
- farmer_alerts
- recommendations
- market_prices
- marketplace_listings
- marketplace_orders

---

## Step 2: Configure Environment Variables

### For local development

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://yourproject.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Server-side only (Vercel functions — do NOT use VITE_ prefix)
SUPABASE_URL=https://yourproject.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Optional — Open-Meteo is used as a free fallback if absent
OPENWEATHER_API_KEY=your_openweather_key_here
```

### For Vercel

In your Vercel project → Settings → Environment Variables, add all of the above.
The `VITE_` prefixed variables go into the **Build** environment.
The non-VITE variables go into the **Function** environment (they are server-side secrets).

---

## Step 3: Enable Supabase Auth

In Supabase Dashboard → Authentication → Providers:
- Enable **Email** (with email confirmation if desired)

In Authentication → URL Configuration:
- Site URL: `https://your-vercel-app.vercel.app`
- Redirect URLs: `https://your-vercel-app.vercel.app/auth/callback`

---

## Step 4: Deploy to Vercel

### Via Vercel CLI

```bash
npm install
npm run build          # verify build passes locally first
npx vercel --prod
```

### Via GitHub

1. Push this repository to GitHub
2. Import the project in Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-deploys on every push to main

---

## Step 5: Verify

After deployment:

1. Visit your Vercel URL
2. Register a new account
3. Complete onboarding
4. Check Dashboard → all cards show empty state (no fake data)
5. Add a farm in Farm Profile
6. Check Marketplace — public browse works without login
7. Check Weather — live data from Open-Meteo
8. Check AI Assistant — responds via Gemini

---

## Commands

```bash
npm install          # install dependencies
npm run dev          # local dev server
npm run build        # production build
npm run typecheck    # TypeScript check (0 errors)
npm run lint         # ESLint check (0 errors, 0 warnings)
npm run farm:operations:audit
npm run real-data:audit
npm run next20:full-audit
npm run lint:cleanup:audit
```

---

## Architecture Notes

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **AI**: Google Gemini via server-side Vercel function (`/api/gemini`)
- **Weather**: Open-Meteo (free, no key required) or OpenWeatherMap
- **Deployment**: Vercel (static frontend + serverless API functions)
- **Node**: 22 (see `.nvmrc`)

