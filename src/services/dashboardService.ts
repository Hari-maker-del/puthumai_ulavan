import { supabase } from '@/lib/supabase';
import { fetchWeather } from '@/services/weatherService';
import type { DashboardResponse, FieldOverview, CropStatus, Task, NotificationItem, TrendPoint, YieldTrendPoint } from '@/services/types';

const cropColors: Record<string, string> = {
  Paddy: '#22c55e', Rice: '#22c55e', Tomato: '#ef4444', Maize: '#f59e0b',
  Groundnut: '#f97316', Cotton: '#8b5cf6', Sugarcane: '#0ea5e9', Banana: '#84cc16',
};

function colorForCrop(crop: string) {
  return cropColors[crop] ?? '#16a34a';
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'PU';
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  if (!userId) throw new Error('Sign in to load your dashboard.');

  const [profileResult, farmsResult, fieldsResult, cropsResult, expensesResult, tasksResult, alertsResult, salesResult, yieldResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('farms').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('fields').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('crops').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }).limit(500),
    supabase.from('farm_tasks').select('*').eq('user_id', userId).order('due_at', { ascending: true }).limit(100),
    supabase.from('farmer_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('farm_sales').select('*').eq('user_id', userId).order('sold_at', { ascending: false }).limit(500),
    supabase.from('yield_predictions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
  ]);

  const firstError = [profileResult, farmsResult, fieldsResult, cropsResult, expensesResult, tasksResult, alertsResult, salesResult, yieldResult].find(result => result.error)?.error;
  if (firstError) throw new Error(firstError.message);

  const profile = profileResult.data;
  const farms = farmsResult.data ?? [];
  const fields = fieldsResult.data ?? [];
  const crops = cropsResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const tasksRows = tasksResult.data ?? [];
  const alertRows = alertsResult.data ?? [];
  const sales = salesResult.data ?? [];
  const predictions = yieldResult.data ?? [];

  const totalAcreage = farms.reduce((sum, farm) => sum + Number(farm.area ?? 0), 0);
  const activeFields = fields.length;
  const healthValues = [
    ...crops.map(row => Number(row.health)).filter(value => Number.isFinite(value)),
    ...farms.map(row => Number(row.health)).filter(value => Number.isFinite(value)),
  ];
  const avgHealth = healthValues.length ? Math.round(healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 0;

  const fieldOverview: FieldOverview[] = fields.map(field => ({
    name: String(field.name ?? 'Field'),
    crop: String(field.crop ?? crops.find(c => String(c.field ?? '').toLowerCase() === String(field.name ?? '').toLowerCase())?.name ?? 'Crop not recorded'),
    area: `${Number(field.area_acres ?? 0).toFixed(1)} ac`,
    health: Number(field.health ?? 0),
    stage: String(field.stage ?? 'Not recorded'),
    color: colorForCrop(String(field.crop ?? '')),
  }));

  const cropStatus: CropStatus[] = crops.map(crop => ({
    name: String(crop.name ?? 'Crop'),
    variety: String(crop.variety ?? 'Not recorded'),
    field: String(crop.field ?? 'Not assigned'),
    stage: String(crop.stage ?? 'Not recorded'),
    health: Number(crop.health ?? 0),
    daysToHarvest: 0,
    area: `${Number(crop.area_acres ?? 0).toFixed(1)} ac`,
    color: colorForCrop(String(crop.name ?? '')),
  }));

  const tasks: Task[] = tasksRows.map(row => ({
    id: String(row.id),
    title: String(row.title ?? 'Farm task'),
    due: row.due_at ? new Date(String(row.due_at)).toLocaleDateString('en-IN') : 'Not scheduled',
    priority: 'medium',
    done: ['completed', 'done'].includes(String(row.status ?? '').toLowerCase()),
    field: String(row.field ?? row.assignee ?? 'Farm-wide'),
  }));

  const notifications: NotificationItem[] = alertRows.map(row => ({
    id: String(row.id),
    title: String(row.title ?? 'Farm alert'),
    detail: String(row.detail ?? ''),
    time: row.created_at ? new Date(String(row.created_at)).toLocaleString('en-IN') : '',
    type: ['weather', 'crop', 'expense', 'ai'].includes(String(row.alert_type)) ? String(row.alert_type) as NotificationItem['type'] : 'ai',
  }));

  const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const now = new Date();
  const currentMonth = monthKey(now);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonth = monthKey(previous);
  const revenueLastMonth = sales.filter(row => String(row.sold_at ?? '').startsWith(previousMonth)).reduce((sum, row) => sum + Number(row.quantity ?? 0) * Number(row.unit_price ?? 0), 0);
  const expensesLastMonth = expenses.filter(row => String(row.date ?? '').startsWith(previousMonth)).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const currentRevenue = sales.filter(row => String(row.sold_at ?? '').startsWith(currentMonth)).reduce((sum, row) => sum + Number(row.quantity ?? 0) * Number(row.unit_price ?? 0), 0);
  const expectedRevenue = currentRevenue > 0 ? currentRevenue : 0;
  const expectedProfit = expectedRevenue - totalExpenses;

  const profitTrend: TrendPoint[] = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = monthKey(date);
    return {
      month: date.toLocaleDateString('en-IN', { month: 'short' }),
      revenue: sales.filter(row => String(row.sold_at ?? '').startsWith(key)).reduce((sum, row) => sum + Number(row.quantity ?? 0) * Number(row.unit_price ?? 0), 0),
      cost: expenses.filter(row => String(row.date ?? '').startsWith(key)).reduce((sum, row) => sum + Number(row.amount ?? 0), 0),
    };
  });

  const yieldTrend: YieldTrendPoint[] = predictions.slice(0, 6).reverse().map(row => ({
    month: new Date(String(row.created_at)).toLocaleDateString('en-IN', { month: 'short' }),
    actual: null,
    predicted: Number(row.predicted_yield ?? 0),
  }));

  const location = String(farms[0]?.location ?? [profile?.district, profile?.state].filter(Boolean).join(', '));
  let weather = null;
  if (location) {
    try { weather = await fetchWeather(location); } catch { weather = null; }
  }

  const farmerName = String(profile?.full_name ?? profile?.email ?? 'Farmer');
  return {
    farmerProfile: {
      name: farmerName,
      initials: initials(farmerName),
      plan: 'Farmer',
      location: location || 'Location not recorded',
      memberSince: profile?.created_at ? new Date(String(profile.created_at)).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—',
      totalAcreage,
      activeFields,
      seasonsCompleted: 0,
      rating: 0,
      verified: Boolean(profile?.id),
    },
    kpis: { activeFields, totalAcreage, openTasks: tasks.filter(task => !task.done).length, avgHealth },
    finance: {
      expectedRevenue,
      revenueLastMonth,
      totalExpenses,
      expensesLastMonth,
      expectedProfit,
      profitMargin: expectedRevenue > 0 ? Math.round((expectedProfit / expectedRevenue) * 100) : 0,
      profitPerAcre: totalAcreage > 0 ? Math.round(expectedProfit / totalAcreage) : 0,
    },
    weather: weather as DashboardResponse['weather'],
    fields: fieldOverview,
    cropStatus,
    tasks,
    notifications,
    profitTrend,
    yieldTrend,
  };
}
