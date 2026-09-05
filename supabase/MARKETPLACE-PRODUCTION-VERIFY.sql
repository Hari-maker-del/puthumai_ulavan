-- Run after applying all migrations in the production Supabase project.
-- These checks verify that the online marketplace table and public listing policy exist.
select to_regclass('public.marketplace_listings') as marketplace_listings_table;
select to_regclass('public.marketplace_orders') as marketplace_orders_table;

select policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'marketplace_listings'
order by policyname;

select id, product_name, category, available_quantity, unit, price, location, created_at
from public.marketplace_listings
where available_quantity > 0
order by created_at desc
limit 20;
