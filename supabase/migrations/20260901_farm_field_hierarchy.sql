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
