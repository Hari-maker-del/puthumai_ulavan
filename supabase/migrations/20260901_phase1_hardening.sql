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
