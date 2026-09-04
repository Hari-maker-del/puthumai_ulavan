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
