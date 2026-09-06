-- Marketplace production schema compatibility.
-- The Marketplace UI/service expects available_quantity on marketplace_listings.
-- Idempotent: safe to run on databases where the column already exists.

alter table public.marketplace_listings
  add column if not exists available_quantity numeric;

update public.marketplace_listings
set available_quantity = quantity
where available_quantity is null;

alter table public.marketplace_listings
  alter column available_quantity set default 0;

notify pgrst, 'reload schema';
