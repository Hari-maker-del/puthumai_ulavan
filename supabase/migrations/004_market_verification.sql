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
