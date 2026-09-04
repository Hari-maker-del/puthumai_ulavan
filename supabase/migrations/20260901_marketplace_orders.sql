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
create policy marketplace_listings_public_read on public.marketplace_listings for select to authenticated using (available_quantity > 0 or seller_id = auth.uid());

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
