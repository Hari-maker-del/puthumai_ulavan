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
