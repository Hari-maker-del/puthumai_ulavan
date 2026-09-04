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
