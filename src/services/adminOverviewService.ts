import { supabase } from '@/lib/supabase';

export interface AdminOverview {
  registered_farmers: number;
  total_farms: number;
  total_area: number;
  current_crops: number;
  active_alerts: number;
  revenue: number;
  expenses: number;
  crop_distribution: Array<{ name: string; value: number }>;
  monthly_revenue: Array<{ month: string; revenue: number }>;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data, error } = await supabase.rpc('get_admin_overview');
  if (error) throw new Error(error.message);
  const value = data as Partial<AdminOverview>;
  return {
    registered_farmers: Number(value.registered_farmers ?? 0),
    total_farms: Number(value.total_farms ?? 0),
    total_area: Number(value.total_area ?? 0),
    current_crops: Number(value.current_crops ?? 0),
    active_alerts: Number(value.active_alerts ?? 0),
    revenue: Number(value.revenue ?? 0),
    expenses: Number(value.expenses ?? 0),
    crop_distribution: Array.isArray(value.crop_distribution) ? value.crop_distribution.map(row => ({ name: String(row.name ?? 'Unknown'), value: Number(row.value ?? 0) })) : [],
    monthly_revenue: Array.isArray(value.monthly_revenue) ? value.monthly_revenue.map(row => ({ month: String(row.month ?? ''), revenue: Number(row.revenue ?? 0) })) : [],
  };
}
