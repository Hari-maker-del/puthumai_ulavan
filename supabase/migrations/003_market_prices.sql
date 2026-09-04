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
