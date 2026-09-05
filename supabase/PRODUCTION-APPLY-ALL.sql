-- Puthumai Uzhavan — PRODUCTION APPLY ALL
-- Run this in your Supabase SQL editor for a fresh deployment.
-- All statements are idempotent. Safe to run on an empty database.
-- DO NOT run on a live database without reviewing each section first.


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/000_base_farmer_schema.sql
-- ═══════════════════════════════════════════
-- Puthumai Uzhavan base farmer schema.
-- Idempotent foundation for a fresh Supabase project.
-- All farmer-owned tables use user_id -> auth.users(id).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  avatar_url text,
  village text,
  district text,
  state text,
  farm_size numeric(10,2),
  preferred_language text default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.farms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  location text not null,
  crop text not null,
  area numeric(10,2) not null check (area > 0),
  health numeric(5,2) not null default 0 check (health >= 0 and health <= 100),
  status text not null default 'Active',
  description text,
  soil_type text,
  village text,
  district text,
  irrigation_type text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade legacy farms schemas that used owner_id. The application contract is user_id.
alter table public.farms add column if not exists user_id uuid;
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='farms' and column_name='owner_id') then
    execute 'update public.farms set user_id = owner_id where user_id is null';
  end if;
end $$;
update public.farms set user_id = null where user_id is not null and not exists (select 1 from auth.users u where u.id = public.farms.user_id);

create table if not exists public.crops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  field text,
  name text not null,
  variety text,
  area_acres numeric(10,2),
  stage text,
  health numeric(5,2) check (health is null or (health >= 0 and health <= 100)),
  planted_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  date date not null default current_date,
  category text not null,
  description text,
  field text,
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  state text,
  district text,
  soil_type text,
  season text,
  land_size numeric(10,2),
  water_availability text,
  previous_crop text,
  recommended_crop text not null,
  expected_yield text,
  profit_estimate numeric(14,2),
  required_water text,
  fertilizer_advice text,
  created_at timestamptz not null default now()
);

create table if not exists public.crop_scans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  crop text not null,
  field text not null,
  disease text,
  confidence numeric(5,2) check (confidence >= 0 and confidence <= 100),
  severity text not null default 'None',
  treatment text,
  status text not null default 'Healthy',
  date text,
  created_at timestamptz not null default now()
);

create table if not exists public.weather_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  location text not null,
  latitude numeric,
  longitude numeric,
  provider text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weather boolean not null default true,
  crop boolean not null default true,
  expense boolean not null default true,
  market boolean not null default true,
  schemes boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.yield_predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete set null,
  field_name text not null,
  crop text not null,
  area_acres numeric(10,2) not null check (area_acres > 0),
  predicted_yield numeric(14,2) not null check (predicted_yield >= 0),
  unit text not null default 'kg',
  confidence numeric(5,2) not null check (confidence >= 0 and confidence <= 100),
  model text not null,
  created_at timestamptz not null default now()
);

create index if not exists farms_user_idx on public.farms(user_id);
create index if not exists crops_user_idx on public.crops(user_id);
create index if not exists crops_farm_idx on public.crops(farm_id);
create index if not exists expenses_user_idx on public.expenses(user_id);
create index if not exists recommendations_user_created_idx on public.recommendations(user_id, created_at desc);
create index if not exists crop_scans_user_created_idx on public.crop_scans(user_id, created_at desc);
create index if not exists weather_cache_user_created_idx on public.weather_cache(user_id, created_at desc);
create index if not exists yield_predictions_user_created_idx on public.yield_predictions(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.farms enable row level security;
alter table public.crops enable row level security;
alter table public.expenses enable row level security;
alter table public.recommendations enable row level security;
alter table public.crop_scans enable row level security;
alter table public.weather_cache enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.yield_predictions enable row level security;

-- Recreate owner-only policies so a partially configured database fails closed.
do $$
declare t text;
begin
  foreach t in array array['farms','crops','expenses','recommendations','crop_scans','weather_cache','notification_preferences','yield_predictions'] loop
    execute format('drop policy if exists pu_owner_select on public.%I', t);
    execute format('drop policy if exists pu_owner_insert on public.%I', t);
    execute format('drop policy if exists pu_owner_update on public.%I', t);
    execute format('drop policy if exists pu_owner_delete on public.%I', t);
    execute format('create policy pu_owner_select on public.%I for select using (auth.uid() = user_id)', t);
    execute format('create policy pu_owner_insert on public.%I for insert with check (auth.uid() = user_id)', t);
    execute format('create policy pu_owner_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format('create policy pu_owner_delete on public.%I for delete using (auth.uid() = user_id)', t);
  end loop;
end $$;

drop policy if exists pu_profile_select on public.profiles;
drop policy if exists pu_profile_insert on public.profiles;
drop policy if exists pu_profile_update on public.profiles;
drop policy if exists pu_profile_delete on public.profiles;
create policy pu_profile_select on public.profiles for select using (auth.uid() = id);
create policy pu_profile_insert on public.profiles for insert with check (auth.uid() = id);
create policy pu_profile_update on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy pu_profile_delete on public.profiles for delete using (auth.uid() = id);

-- Keep farm ownership consistent even when a client sends a wrong user_id.
create or replace function public.set_farm_user_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and new.user_id <> auth.uid() then
    raise exception 'Farm owner must match the authenticated user.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists farms_set_user_id on public.farms;
create trigger farms_set_user_id before insert or update on public.farms
for each row execute function public.set_farm_user_id();

-- Automatically create the application profile after signup.
create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, preferred_language)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data->>'name', ''), coalesce(new.raw_user_meta_data->>'preferred_language', 'en'))
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_user_profile();

-- Enforce the foreign key when the column can be validated on the target database.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farms_user_id_fkey') then
    alter table public.farms add constraint farms_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end $$;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/001_farmer_memory_and_alerts.sql
-- ═══════════════════════════════════════════
-- ================================================================
-- Migration: Farmer Memory, Alerts, Scheme Info
-- Puthumai Uzhavan v2.0
-- ================================================================

-- ── 1. farmer_memory ─────────────────────────────────────────────
-- Stores structured farming data per authenticated farmer
create table if not exists public.farmer_memory (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Identity / location
  farmer_name     text,
  village         text,
  district        text,
  state           text default 'Tamil Nadu',
  -- Farm info
  farm_size_acres numeric(10,2),
  soil_type       text,          -- red, black, alluvial, laterite
  irrigation_method text,        -- drip, sprinkler, flood, rain-fed
  -- Current season
  current_crop    text,
  crop_variety    text,
  crop_stage      text,          -- sowing, vegetative, flowering, harvesting
  planting_date   date,
  expected_harvest date,
  -- History
  previous_crop   text,
  previous_yield_kg numeric(10,2),
  -- Preferences
  preferred_language text default 'en',
  farming_category  text,        -- small, marginal, medium, large
  -- Free-form notes
  extra_notes     text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique(user_id)
);

-- RLS
alter table public.farmer_memory enable row level security;

create policy "farmer_memory_owner_select" on public.farmer_memory
  for select using (auth.uid() = user_id);
create policy "farmer_memory_owner_insert" on public.farmer_memory
  for insert with check (auth.uid() = user_id);
create policy "farmer_memory_owner_update" on public.farmer_memory
  for update using (auth.uid() = user_id);
create policy "farmer_memory_owner_delete" on public.farmer_memory
  for delete using (auth.uid() = user_id);

-- auto-updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger farmer_memory_updated_at
  before update on public.farmer_memory
  for each row execute procedure public.set_updated_at();

-- ── 2. ai_conversations ──────────────────────────────────────────
-- Persists chat history for farm-aware AI
create table if not exists public.ai_conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','assistant')),
  message    text not null,
  context    jsonb,            -- optional: crop/weather snapshot at time of message
  created_at timestamptz default now()
);

create index if not exists ai_conversations_user_created
  on public.ai_conversations(user_id, created_at desc);

alter table public.ai_conversations enable row level security;

create policy "ai_conv_owner_select" on public.ai_conversations
  for select using (auth.uid() = user_id);
create policy "ai_conv_owner_insert" on public.ai_conversations
  for insert with check (auth.uid() = user_id);
create policy "ai_conv_owner_delete" on public.ai_conversations
  for delete using (auth.uid() = user_id);

-- ── 3. farmer_alerts ─────────────────────────────────────────────
-- Smart farming alerts / reminders
create table if not exists public.farmer_alerts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  detail      text,
  alert_type  text not null check (alert_type in ('weather','crop','irrigation','scheme','reminder','health','ai')),
  severity    text default 'info' check (severity in ('info','warning','critical')),
  is_read     boolean default false,
  is_live     boolean default false,  -- false = AI/static reminder, true = live data
  created_at  timestamptz default now()
);

create index if not exists farmer_alerts_user_created
  on public.farmer_alerts(user_id, created_at desc);

alter table public.farmer_alerts enable row level security;

create policy "alerts_owner_select" on public.farmer_alerts
  for select using (auth.uid() = user_id);
create policy "alerts_owner_insert" on public.farmer_alerts
  for insert with check (auth.uid() = user_id);
create policy "alerts_owner_update" on public.farmer_alerts
  for update using (auth.uid() = user_id);
create policy "alerts_owner_delete" on public.farmer_alerts
  for delete using (auth.uid() = user_id);


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/002_ai_conversation_threads.sql
-- ═══════════════════════════════════════════
-- AI conversation threads: keeps the existing ai_conversations table and adds grouping metadata.
alter table public.ai_conversations
  add column if not exists conversation_id uuid,
  add column if not exists title text;

update public.ai_conversations
set conversation_id = id
where conversation_id is null;

alter table public.ai_conversations
  alter column conversation_id set default gen_random_uuid();

alter table public.ai_conversations
  alter column conversation_id set not null;

create index if not exists ai_conversations_thread_idx
  on public.ai_conversations(user_id, conversation_id, created_at);


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/003_market_prices.sql
-- ═══════════════════════════════════════════
-- ================================================================
-- Migration: Market Prices
-- Puthumai Uzhavan v2.1
-- ================================================================

-- ── market_prices ────────────────────────────────────────────────
-- Stores farmer-entered / verified market price records.
-- No fake or seeded data is inserted by this migration; the table
-- starts empty and the app must treat an empty result set as
-- "no verified market records available" rather than an error.
create table if not exists public.market_prices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  crop        text not null,
  market      text,
  district    text,
  state       text,
  price       numeric not null,
  unit        text default '₹/quintal',
  price_date  date,
  source      text,
  created_at  timestamptz default now()
);

-- RLS
alter table public.market_prices enable row level security;

create policy "market_prices_owner_select" on public.market_prices
  for select using (auth.uid() = user_id);
create policy "market_prices_owner_insert" on public.market_prices
  for insert with check (auth.uid() = user_id);
create policy "market_prices_owner_update" on public.market_prices
  for update using (auth.uid() = user_id);
create policy "market_prices_owner_delete" on public.market_prices
  for delete using (auth.uid() = user_id);

-- Indexes
create index if not exists market_prices_user_idx on public.market_prices(user_id);
create index if not exists market_prices_crop_idx on public.market_prices(crop);
create index if not exists market_prices_price_date_idx on public.market_prices(price_date);
alter table public.market_prices add column if not exists state text;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/004_market_verification.sql
-- ═══════════════════════════════════════════
-- Production hardening for market intelligence.
alter table public.market_prices
  add column if not exists is_verified boolean not null default false;

create index if not exists market_prices_verified_idx
  on public.market_prices(is_verified, crop, price_date desc);

-- Replace the original SELECT policy with a policy that supports two safe cases:
-- 1) a farmer can read their own records;
-- 2) verified records can be read by authenticated farmers.
drop policy if exists "market_prices_owner_select" on public.market_prices;
create policy "market_prices_select" on public.market_prices
  for select using (auth.uid() = user_id or (auth.uid() is not null and is_verified = true));

-- Only the owner may insert/update/delete their own record. Verification should be performed by a trusted backend/admin workflow.
drop policy if exists "market_prices_owner_insert" on public.market_prices;
create policy "market_prices_owner_insert" on public.market_prices
  for insert with check (auth.uid() = user_id);

drop policy if exists "market_prices_owner_update" on public.market_prices;
create policy "market_prices_owner_update" on public.market_prices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "market_prices_owner_delete" on public.market_prices;
create policy "market_prices_owner_delete" on public.market_prices
  for delete using (auth.uid() = user_id);

-- Prevent normal browser clients from self-promoting a record to verified.
-- A trusted backend/service-role workflow can set is_verified explicitly.
create or replace function public.prevent_client_market_verification()
returns trigger
language plpgsql
security invoker
as $$
begin
  if auth.uid() is not null and new.is_verified is distinct from old.is_verified then
    new.is_verified := old.is_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists market_prices_prevent_client_verification on public.market_prices;
create trigger market_prices_prevent_client_verification
before update on public.market_prices
for each row execute procedure public.prevent_client_market_verification();


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/005_production_data_integrity.sql
-- ═══════════════════════════════════════════
-- Puthumai Uzhavan production data integrity hardening.
-- Apply after migrations 001-004.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'market_prices_price_nonnegative') then
    alter table public.market_prices
      add constraint market_prices_price_nonnegative check (price >= 0);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'farmer_memory_farm_size_nonnegative') then
    alter table public.farmer_memory
      add constraint farmer_memory_farm_size_nonnegative
      check (farm_size_acres is null or farm_size_acres >= 0);
  end if;
end $$;

drop policy if exists "market_prices_owner_insert" on public.market_prices;
create policy "market_prices_owner_insert"
on public.market_prices
for insert
with check (auth.uid() is not null and auth.uid() = user_id);

create or replace function public.prevent_client_market_verification_insert()
returns trigger language plpgsql security invoker as $$
begin
  if auth.uid() is not null then new.is_verified := false; end if;
  return new;
end;
$$;

drop trigger if exists market_prices_prevent_client_verification_insert on public.market_prices;
create trigger market_prices_prevent_client_verification_insert
before insert on public.market_prices
for each row execute procedure public.prevent_client_market_verification_insert();


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260817_real_farmer_rls_gate.sql
-- ═══════════════════════════════════════════
-- Real-farmer security gate.
-- APPLY AND REVIEW AGAINST THE ACTUAL SCHEMA BEFORE PRODUCTION.
-- This intentionally fails closed for the requirement: user-owned tables must have RLS.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','farms','crops','expenses','farmer_alerts','recommendations']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- IMPORTANT:
-- Existing project-specific policies must be reviewed for owner columns.
-- Do not create permissive "authenticated users can do everything" policies.
-- Verify SELECT/INSERT/UPDATE/DELETE for two different real users before release.


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260817_realtime_farmer_tables.sql
-- ═══════════════════════════════════════════
-- Puthumai Uzhavan realtime publication.
-- Apply to the REAL Supabase project using the Supabase SQL editor/migrations.
-- RLS remains mandatory; Realtime must not expose rows a user cannot read.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['farms','expenses','crops','farmer_alerts','recommendations','fields']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = tbl AND relkind = 'r') THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Recommended production setting: Realtime should respect RLS.
-- Confirm this in the live Supabase project's Realtime settings before launch.


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260818_production_rls_owner_gate.sql
-- ═══════════════════════════════════════════
DO $$
DECLARE t text;
BEGIN
FOREACH t IN ARRAY ARRAY['profiles','farms','crops','expenses','farmer_alerts','recommendations']
LOOP
IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
END IF;
END LOOP;
END $$;
-- Review existing policies: every farmer-owned SELECT/INSERT/UPDATE/DELETE policy must compare ownership with auth.uid().
-- Do not add permissive authenticated-user policies.


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260824_notification_preferences.sql
-- ═══════════════════════════════════════════
create table if not exists public.notification_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 weather boolean not null default true,
 crop boolean not null default true,
 expense boolean not null default true,
 market boolean not null default true,
 schemes boolean not null default true,
 updated_at timestamptz not null default now()
);
alter table public.notification_preferences enable row level security;
drop policy if exists notification_preferences_own on public.notification_preferences;
create policy notification_preferences_own on public.notification_preferences
for all using (user_id=auth.uid()) with check (user_id=auth.uid());


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260825_core_farm_operations.sql
-- ═══════════════════════════════════════════
create table if not exists public.farm_tasks(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,title text not null,description text,due_at timestamptz not null,status text not null default 'planned',assignee text,machinery text,created_at timestamptz not null default now());
create table if not exists public.farm_inventory(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null,category text,quantity numeric not null default 0,unit text,unit_cost numeric, batch_number text,created_at timestamptz not null default now());
create table if not exists public.irrigation_schedules(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,field_id uuid,scheduled_at timestamptz not null,water_volume_liters numeric,source text,status text default 'planned');
create table if not exists public.farm_equipment(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,name text not null,equipment_type text,maintenance_due_at timestamptz,fuel_used numeric,service_interval_hours numeric); 
create table if not exists public.farm_sales(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,buyer_name text not null,quantity numeric not null,unit text,unit_price numeric not null,sold_at timestamptz not null,contract_date timestamptz,notes text);
create table if not exists public.soil_tests(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,field_id uuid,tested_at timestamptz not null,nitrogen numeric,phosphorus numeric,potassium numeric,ph numeric,report_url text,notes text);
create table if not exists public.knowledge_articles(id uuid primary key default gen_random_uuid(),title text not null,summary text,source_url text not null,updated_at timestamptz not null default now());
create table if not exists public.community_posts(id uuid primary key default gen_random_uuid(),author_id uuid not null references auth.users(id) on delete cascade,title text not null,body text not null,created_at timestamptz not null default now());
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['farm_tasks','farm_inventory','irrigation_schedules','farm_equipment','farm_sales','soil_tests'] LOOP EXECUTE format('alter table public.%I enable row level security',t); EXECUTE format('drop policy if exists own_%I on public.%I',t,t); EXECUTE format('create policy own_%I on public.%I for all using (user_id=auth.uid()) with check (user_id=auth.uid())',t,t); END LOOP; END $$;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260825_farm_operations_rls.sql
-- ═══════════════════════════════════════════
-- Explicit RLS policies for the core farm-operation tables.
-- Table/column names match 20260825_core_farm_operations.sql.
DO $$
BEGIN
 IF to_regclass('public.farm_tasks') IS NOT NULL THEN
  ALTER TABLE public.farm_tasks ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_tasks_owner ON public.farm_tasks;
  CREATE POLICY farm_tasks_owner ON public.farm_tasks
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_inventory') IS NOT NULL THEN
  ALTER TABLE public.farm_inventory ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_inventory_owner ON public.farm_inventory;
  CREATE POLICY farm_inventory_owner ON public.farm_inventory
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.irrigation_schedules') IS NOT NULL THEN
  ALTER TABLE public.irrigation_schedules ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS irrigation_schedules_owner ON public.irrigation_schedules;
  CREATE POLICY irrigation_schedules_owner ON public.irrigation_schedules
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_equipment') IS NOT NULL THEN
  ALTER TABLE public.farm_equipment ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_equipment_owner ON public.farm_equipment;
  CREATE POLICY farm_equipment_owner ON public.farm_equipment
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_sales') IS NOT NULL THEN
  ALTER TABLE public.farm_sales ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_sales_owner ON public.farm_sales;
  CREATE POLICY farm_sales_owner ON public.farm_sales
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.soil_tests') IS NOT NULL THEN
  ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS soil_tests_owner ON public.soil_tests;
  CREATE POLICY soil_tests_owner ON public.soil_tests
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.community_posts') IS NOT NULL THEN
  ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS community_posts_owner ON public.community_posts;
  CREATE POLICY community_posts_owner ON public.community_posts
    FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
 END IF;
END $$;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260830_farmer_memory_schema_refresh.sql
-- ═══════════════════════════════════════════
-- Ensure the Farmer Memory API surface exists and PostgREST refreshes its schema cache.
-- Safe to run after any earlier Farmer Memory migration.
create table if not exists public.farmer_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farmer_name text, village text, district text, state text default 'Tamil Nadu',
  farm_size_acres numeric(10,2), soil_type text, irrigation_method text,
  current_crop text, crop_variety text, crop_stage text, planting_date date,
  expected_harvest date, previous_crop text, previous_yield_kg numeric(10,2),
  preferred_language text default 'en', farming_category text, extra_notes text,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.farmer_memory enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'farmer_memory' and policyname = 'farmer_memory_owner_select') then
    create policy farmer_memory_owner_select on public.farmer_memory
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'farmer_memory' and policyname = 'farmer_memory_owner_insert') then
    create policy farmer_memory_owner_insert on public.farmer_memory
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'farmer_memory' and policyname = 'farmer_memory_owner_update') then
    create policy farmer_memory_owner_update on public.farmer_memory
      for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'farmer_memory' and policyname = 'farmer_memory_owner_delete') then
    create policy farmer_memory_owner_delete on public.farmer_memory
      for delete using (auth.uid() = user_id);
  end if;
end $$;

notify pgrst, 'reload schema';


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260901_admin_overview.sql
-- ═══════════════════════════════════════════
-- Read-only admin overview. Access is restricted to users whose auth metadata role is admin.
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  role_value text := coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '');
  result jsonb;
begin
  if auth.uid() is null or role_value <> 'admin' then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'registered_farmers', (select count(*) from public.profiles),
    'total_farms', (select count(*) from public.farms),
    'total_area', coalesce((select sum(area) from public.farms), 0),
    'current_crops', (select count(*) from public.crops),
    'active_alerts', (select count(*) from public.farmer_alerts where coalesce(is_read,false) = false),
    'revenue', coalesce((select sum(quantity * unit_price) from public.farm_sales), 0),
    'expenses', coalesce((select sum(amount) from public.expenses), 0),
    'crop_distribution', coalesce((select jsonb_agg(x order by x.value desc) from (select coalesce(nullif(trim(name),''),'Unknown') as name, count(*)::int as value from public.crops group by 1) x), '[]'::jsonb),
    'monthly_revenue', coalesce((select jsonb_agg(x order by x.month) from (select to_char(date_trunc('month', sold_at), 'Mon YYYY') as month, date_trunc('month', sold_at) as sort_month, sum(quantity * unit_price)::numeric as revenue from public.farm_sales where sold_at >= date_trunc('month', now()) - interval '5 months' group by 1,2 order by sort_month) x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_admin_overview() from public;
grant execute on function public.get_admin_overview() to authenticated;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260901_farm_field_hierarchy.sql
-- ═══════════════════════════════════════════
-- Farmer -> Farms -> Fields hierarchy
-- A farmer owns many farms; every field belongs to exactly one farm.

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area_acres numeric not null check (area_acres > 0),
  soil_type text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fields add column if not exists farm_id uuid;
alter table public.fields add column if not exists user_id uuid;
alter table public.fields add column if not exists area_acres numeric;
alter table public.fields add column if not exists soil_type text;
alter table public.fields add column if not exists latitude numeric;
alter table public.fields add column if not exists longitude numeric;
alter table public.fields add column if not exists created_at timestamptz default now();
alter table public.fields add column if not exists updated_at timestamptz default now();

-- If an older fields table used owner_id, copy it into user_id first.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='fields' and column_name='owner_id'
  ) then
    execute 'update public.fields set user_id = owner_id where user_id is null';
  end if;
end $$;

-- Safely backfill unambiguous legacy rows: if a farmer has exactly one farm,
-- that farm is the only valid parent. Rows belonging to farmers with multiple
-- farms are intentionally left unassigned and must be linked explicitly.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='fields' and column_name='area') then
    execute 'update public.fields set area_acres = area where area_acres is null';
  end if;
end $$;

update public.fields fld
set farm_id = only_farm.id
from lateral (
  select f.id
  from public.farms f
  where f.user_id = fld.user_id
  order by f.created_at nulls last, f.id
  limit 1
) only_farm
where fld.farm_id is null
  and fld.user_id is not null
  and (select count(*) from public.farms f2 where f2.user_id = fld.user_id) = 1;

-- Existing rows for farmers with multiple farms must be assigned to the
-- correct farm rather than guessed. New records are always required to have
-- farm_id and user_id.

create index if not exists fields_farm_id_idx on public.fields(farm_id);
create index if not exists fields_user_id_idx on public.fields(user_id);

alter table public.fields drop constraint if exists fields_farm_id_fkey;
alter table public.fields
  add constraint fields_farm_id_fkey foreign key (farm_id) references public.farms(id) on delete cascade;

create or replace function public.sync_field_owner_from_farm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare farm_owner uuid;
begin
  if new.farm_id is null then
    raise exception 'Every field must belong to a farm.';
  end if;

  select user_id into farm_owner from public.farms where id = new.farm_id;
  if farm_owner is null then
    raise exception 'Selected farm does not exist or has no owner.';
  end if;

  if auth.uid() is not null and farm_owner <> auth.uid() then
    raise exception 'You can only modify fields belonging to your own farm.';
  end if;

  new.user_id := farm_owner;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fields_sync_owner on public.fields;
create trigger fields_sync_owner
before insert or update of farm_id on public.fields
for each row execute function public.sync_field_owner_from_farm();

alter table public.fields enable row level security;

drop policy if exists fields_farmer_select on public.fields;
create policy fields_farmer_select on public.fields
for select using (exists (select 1 from public.farms f where f.id = fields.farm_id and f.user_id = auth.uid()));

drop policy if exists fields_farmer_insert on public.fields;
create policy fields_farmer_insert on public.fields
for insert with check (exists (select 1 from public.farms f where f.id = fields.farm_id and f.user_id = auth.uid()));

drop policy if exists fields_farmer_update on public.fields;
create policy fields_farmer_update on public.fields
for update using (exists (select 1 from public.farms f where f.id = fields.farm_id and f.user_id = auth.uid()))
with check (exists (select 1 from public.farms f where f.id = fields.farm_id and f.user_id = auth.uid()));

drop policy if exists fields_farmer_delete on public.fields;
create policy fields_farmer_delete on public.fields
for delete using (exists (select 1 from public.farms f where f.id = fields.farm_id and f.user_id = auth.uid()));


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260901_marketplace_orders.sql
-- ═══════════════════════════════════════════
-- Marketplace listings + lightweight order flow.
-- No payment gateway is implied: this records a buyer request/order and seller decision.

create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  seller_name text not null default 'Farmer',
  product_name text not null,
  category text not null check (category in ('Crops','Seeds','Vegetables','Fruits','Inputs','Equipment')),
  quantity numeric(14,2) not null check (quantity > 0),
  available_quantity numeric(14,2) not null check (available_quantity >= 0 and available_quantity <= quantity),
  unit text not null,
  price numeric(14,2) not null check (price >= 0),
  location text not null,
  description text not null default '',
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_listings_created_idx on public.marketplace_listings(created_at desc);
create index if not exists marketplace_listings_seller_idx on public.marketplace_listings(seller_id);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  quantity numeric(14,2) not null check (quantity > 0),
  unit text not null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  total_amount numeric(16,2) not null check (total_amount >= 0),
  status text not null default 'pending' check (status in ('pending','accepted','rejected','cancelled','completed')),
  buyer_note text,
  seller_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_orders_buyer_idx on public.marketplace_orders(buyer_id, created_at desc);
create index if not exists marketplace_orders_seller_idx on public.marketplace_orders(seller_id, created_at desc);
create index if not exists marketplace_orders_listing_idx on public.marketplace_orders(listing_id, created_at desc);

alter table public.marketplace_listings enable row level security;
alter table public.marketplace_orders enable row level security;

drop policy if exists marketplace_listings_public_read on public.marketplace_listings;
create policy marketplace_listings_public_read on public.marketplace_listings for select to anon, authenticated using (available_quantity > 0 or seller_id = auth.uid());

drop policy if exists marketplace_listings_owner_insert on public.marketplace_listings;
create policy marketplace_listings_owner_insert on public.marketplace_listings for insert to authenticated with check (seller_id = auth.uid());

drop policy if exists marketplace_listings_owner_update on public.marketplace_listings;
create policy marketplace_listings_owner_update on public.marketplace_listings for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

drop policy if exists marketplace_listings_owner_delete on public.marketplace_listings;
create policy marketplace_listings_owner_delete on public.marketplace_listings for delete to authenticated using (seller_id = auth.uid());

drop policy if exists marketplace_orders_participant_read on public.marketplace_orders;
create policy marketplace_orders_participant_read on public.marketplace_orders for select to authenticated using (buyer_id = auth.uid() or seller_id = auth.uid());

drop policy if exists marketplace_orders_buyer_insert on public.marketplace_orders;
create policy marketplace_orders_buyer_insert on public.marketplace_orders for insert to authenticated with check (buyer_id = auth.uid());

drop policy if exists marketplace_orders_buyer_update on public.marketplace_orders;
create policy marketplace_orders_buyer_update on public.marketplace_orders for update to authenticated using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());

drop policy if exists marketplace_orders_seller_update on public.marketplace_orders;
create policy marketplace_orders_seller_update on public.marketplace_orders for update to authenticated using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create or replace function public.create_marketplace_order(
  p_listing_id uuid,
  p_buyer_id uuid,
  p_quantity numeric,
  p_buyer_note text default null
)
returns public.marketplace_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  listing public.marketplace_listings%rowtype;
  new_order public.marketplace_orders%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then
    raise exception 'Buyer must match the authenticated user.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Order quantity must be greater than zero.';
  end if;

  select * into listing
  from public.marketplace_listings
  where id = p_listing_id
  for update;

  if not found then raise exception 'Listing not found.'; end if;
  if listing.seller_id = auth.uid() then raise exception 'You cannot order your own listing.'; end if;
  if listing.available_quantity < p_quantity then raise exception 'Requested quantity is not available.'; end if;

  update public.marketplace_listings
  set available_quantity = available_quantity - p_quantity, updated_at = now()
  where id = listing.id;

  insert into public.marketplace_orders(listing_id,buyer_id,seller_id,quantity,unit,unit_price,total_amount,buyer_note)
  values (listing.id, auth.uid(), listing.seller_id, p_quantity, listing.unit, listing.price, p_quantity * listing.price, nullif(trim(p_buyer_note), ''))
  returning * into new_order;

  return new_order;
end;
$$;

revoke all on function public.create_marketplace_order(uuid,uuid,numeric,text) from public;
grant execute on function public.create_marketplace_order(uuid,uuid,numeric,text) to authenticated;

create or replace function public.set_marketplace_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists marketplace_listings_updated_at on public.marketplace_listings;
create trigger marketplace_listings_updated_at before update on public.marketplace_listings
for each row execute function public.set_marketplace_updated_at();

drop trigger if exists marketplace_orders_updated_at on public.marketplace_orders;
create trigger marketplace_orders_updated_at before update on public.marketplace_orders
for each row execute function public.set_marketplace_updated_at();

-- Profile FKs are added separately so seller/buyer names can be joined safely.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'marketplace_listings_seller_id_fkey') then
    alter table public.marketplace_listings add constraint marketplace_listings_seller_id_fkey foreign key (seller_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'marketplace_orders_seller_id_fkey') then
    alter table public.marketplace_orders add constraint marketplace_orders_seller_id_fkey foreign key (seller_id) references public.profiles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'marketplace_orders_buyer_id_fkey') then
    alter table public.marketplace_orders add constraint marketplace_orders_buyer_id_fkey foreign key (buyer_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

-- Buyers can only cancel their own pending orders; sellers can accept/reject/complete.
drop policy if exists marketplace_orders_buyer_update on public.marketplace_orders;
create policy marketplace_orders_buyer_update on public.marketplace_orders for update to authenticated
using (buyer_id = auth.uid() and status = 'pending')
with check (buyer_id = auth.uid() and status = 'cancelled');

drop policy if exists marketplace_orders_seller_update on public.marketplace_orders;
create policy marketplace_orders_seller_update on public.marketplace_orders for update to authenticated
using (seller_id = auth.uid())
with check (seller_id = auth.uid() and status in ('accepted','rejected','completed'));

create or replace function public.cancel_marketplace_order(p_order_id uuid, p_buyer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare o public.marketplace_orders%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_buyer_id then raise exception 'Buyer must match the authenticated user.'; end if;
  select * into o from public.marketplace_orders where id = p_order_id and buyer_id = auth.uid() for update;
  if not found then raise exception 'Order not found.'; end if;
  if o.status <> 'pending' then raise exception 'Only pending orders can be cancelled.'; end if;
  update public.marketplace_orders set status = 'cancelled' where id = o.id;
  update public.marketplace_listings set available_quantity = available_quantity + o.quantity where id = o.listing_id;
end;
$$;
revoke all on function public.cancel_marketplace_order(uuid,uuid) from public;
grant execute on function public.cancel_marketplace_order(uuid,uuid) to authenticated;

create or replace function public.validate_marketplace_order_transition()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status = new.status then return new; end if;
  if old.status = 'pending' and new.status in ('accepted','rejected','cancelled') then
    if new.status = 'rejected' then
      update public.marketplace_listings set available_quantity = available_quantity + old.quantity where id = old.listing_id;
    end if;
    return new;
  end if;
  if old.status = 'accepted' and new.status = 'completed' then return new; end if;
  raise exception 'Invalid marketplace order status transition from % to %.', old.status, new.status;
end;
$$;

drop trigger if exists marketplace_order_status_transition on public.marketplace_orders;
create trigger marketplace_order_status_transition before update of status on public.marketplace_orders
for each row execute function public.validate_marketplace_order_transition();

-- Keep a display-name snapshot on listings so marketplace browsing does not require
-- relaxing private profile RLS for other farmers.
alter table public.marketplace_listings add column if not exists seller_name text not null default 'Farmer';


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260901_phase1_hardening.sql
-- ═══════════════════════════════════════════
-- Phase 1 production hardening
-- Farmer -> many farms -> many fields, live dashboard data, RLS and realtime.

-- Fields must inherit ownership from their parent farm.
create index if not exists fields_user_farm_idx on public.fields(user_id, farm_id);

create or replace function public.validate_field_farm_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare farm_owner uuid;
begin
  select user_id into farm_owner from public.farms where id = new.farm_id;
  if farm_owner is null then
    raise exception 'Every field must reference an existing farm.';
  end if;
  new.user_id := farm_owner;
  if auth.uid() is not null and farm_owner <> auth.uid() then
    raise exception 'Field does not belong to the authenticated farmer.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists fields_validate_owner on public.fields;
create trigger fields_validate_owner
before insert or update of farm_id on public.fields
for each row execute function public.validate_field_farm_owner();

-- Farmer-owned operational tables must have RLS.
do $$
declare t text;
begin
  foreach t in array array['farms','crops','expenses','recommendations','crop_scans','weather_cache','yield_predictions','farmer_memory','farmer_alerts','farm_tasks','farm_inventory','irrigation_schedules','farm_equipment','farm_sales','soil_tests'] loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end $$;

-- Add fields and market prices to realtime. Existing rows remain protected by RLS.
do $$
begin
  if to_regclass('public.fields') is not null then
    begin alter publication supabase_realtime add table public.fields; exception when duplicate_object then null; end;
    alter table public.fields replica identity full;
  end if;
  if to_regclass('public.market_prices') is not null then
    begin alter publication supabase_realtime add table public.market_prices; exception when duplicate_object then null; end;
    alter table public.market_prices replica identity full;
  end if;
end $$;

-- Reject new orphan fields. Legacy NULL farm_id rows, if any, must be linked explicitly
-- before a NOT NULL constraint can safely be applied.
create or replace function public.reject_orphan_field()
returns trigger language plpgsql as $$
begin
  if new.farm_id is null then raise exception 'A field must belong to a farm.'; end if;
  return new;
end;
$$;

drop trigger if exists fields_reject_orphan on public.fields;
create trigger fields_reject_orphan
before insert or update on public.fields
for each row execute function public.reject_orphan_field();

-- Make farm_id NOT NULL automatically when the existing database has no legacy orphans.
do $$
begin
  if not exists (select 1 from public.fields where farm_id is null) then
    begin alter table public.fields alter column farm_id set not null; exception when others then null; end;
  end if;
end $$;


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/20260902_avatars_storage.sql
-- ═══════════════════════════════════════════
-- Create the avatars storage bucket for profile pictures
-- This bucket stores one avatar per user at {user_id}/avatar.{ext}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                              -- public so avatar URLs work without signed URLs
  2097152,                           -- 2 MB limit matches the frontend validation
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Users can upload / replace their own avatar
create policy "avatars_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Anyone can read avatars (bucket is public)
create policy "avatars_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');


-- ═══════════════════════════════════════════
-- FILE: supabase/migrations/realtime_tables.sql
-- ═══════════════════════════════════════════
-- Puthumai Uzhavan Realtime
-- Safe/idempotent publication setup. RLS remains the security boundary.
DO $$
DECLARE
  t text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  FOREACH t IN ARRAY ARRAY[
    'farms',
    'expenses',
    'crops',
    'farmer_alerts',
    'recommendations',
    'fields'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM pg_publication_tables
         WHERE pubname = 'supabase_realtime'
           AND schemaname = 'public'
           AND tablename = t
       )
    THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Full old-row payloads are required for reliable DELETE/UPDATE reconciliation.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'farms',
    'expenses',
    'crops',
    'farmer_alerts',
    'recommendations',
    'fields'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    END IF;
  END LOOP;
END $$;

