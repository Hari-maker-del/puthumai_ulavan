-- Read-only admin overview. Access is restricted to users whose auth metadata role is admin.
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  role_value text := coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '');
  result jsonb;
begin
  if auth.uid() is null or role_value <> 'admin' then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'registered_farmers', (select count(*) from public.profiles),
    'total_farms', (select count(*) from public.farms),
    'total_area', coalesce((select sum(area) from public.farms), 0),
    'current_crops', (select count(*) from public.crops),
    'active_alerts', (select count(*) from public.farmer_alerts where coalesce(is_read,false) = false),
    'revenue', coalesce((select sum(quantity * unit_price) from public.farm_sales), 0),
    'expenses', coalesce((select sum(amount) from public.expenses), 0),
    'crop_distribution', coalesce((select jsonb_agg(x order by x.value desc) from (select coalesce(nullif(trim(name),''),'Unknown') as name, count(*)::int as value from public.crops group by 1) x), '[]'::jsonb),
    'monthly_revenue', coalesce((select jsonb_agg(x order by x.month) from (select to_char(date_trunc('month', sold_at), 'Mon YYYY') as month, date_trunc('month', sold_at) as sort_month, sum(quantity * unit_price)::numeric as revenue from public.farm_sales where sold_at >= date_trunc('month', now()) - interval '5 months' group by 1,2 order by sort_month) x), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.get_admin_overview() from public;
grant execute on function public.get_admin_overview() to authenticated;
