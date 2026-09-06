-- Production compatibility for Yield Prediction and multi-field farm data.
-- Idempotent: safe when these tables already exist.

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  farm_id uuid references public.farms(id) on delete cascade,
  name text not null,
  location text,
  area_acres numeric(10,2),
  crop text,
  stage text,
  health numeric(5,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fields add column if not exists user_id uuid;
alter table public.fields add column if not exists farm_id uuid;
alter table public.fields add column if not exists name text;
alter table public.fields add column if not exists location text;
alter table public.fields add column if not exists area_acres numeric(10,2);
alter table public.fields add column if not exists crop text;
alter table public.fields add column if not exists stage text;
alter table public.fields add column if not exists health numeric(5,2);
alter table public.fields add column if not exists created_at timestamptz default now();
alter table public.fields add column if not exists updated_at timestamptz default now();

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

alter table public.yield_predictions add column if not exists farm_id uuid;
alter table public.yield_predictions add column if not exists field_name text;
alter table public.yield_predictions add column if not exists crop text;
alter table public.yield_predictions add column if not exists area_acres numeric(10,2);
alter table public.yield_predictions add column if not exists predicted_yield numeric(14,2);
alter table public.yield_predictions add column if not exists unit text default 'kg';
alter table public.yield_predictions add column if not exists confidence numeric(5,2);
alter table public.yield_predictions add column if not exists model text;
alter table public.yield_predictions add column if not exists created_at timestamptz default now();

alter table public.fields enable row level security;
alter table public.yield_predictions enable row level security;

drop policy if exists pu_fields_select on public.fields;
drop policy if exists pu_fields_insert on public.fields;
drop policy if exists pu_fields_update on public.fields;
drop policy if exists pu_fields_delete on public.fields;
create policy pu_fields_select on public.fields for select using (auth.uid() = user_id);
create policy pu_fields_insert on public.fields for insert with check (auth.uid() = user_id);
create policy pu_fields_update on public.fields for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pu_fields_delete on public.fields for delete using (auth.uid() = user_id);

drop policy if exists pu_yield_select on public.yield_predictions;
drop policy if exists pu_yield_insert on public.yield_predictions;
drop policy if exists pu_yield_update on public.yield_predictions;
drop policy if exists pu_yield_delete on public.yield_predictions;
create policy pu_yield_select on public.yield_predictions for select using (auth.uid() = user_id);
create policy pu_yield_insert on public.yield_predictions for insert with check (auth.uid() = user_id);
create policy pu_yield_update on public.yield_predictions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy pu_yield_delete on public.yield_predictions for delete using (auth.uid() = user_id);

create index if not exists fields_user_idx on public.fields(user_id);
create index if not exists fields_farm_idx on public.fields(farm_id);
create index if not exists yield_predictions_user_created_idx on public.yield_predictions(user_id, created_at desc);

notify pgrst, 'reload schema';
