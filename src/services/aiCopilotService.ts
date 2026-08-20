import { supabase } from '@/lib/supabase';
import { fetchWeather, type WeatherData } from '@/services/weatherService';
import { getFarmerMemory, buildFarmerMemoryContext, type FarmerMemory } from '@/services/farmerMemoryService';
import { getAlerts, type FarmerAlert } from '@/services/farmerAlertsService';
import { getExpenses } from '@/services/expenseService';
import { getFarms } from '@/services/farmService';

export interface CopilotContext {
  farmerMemory: FarmerMemory | null;
  farms: Array<Record<string, unknown>>;
  crops: Array<Record<string, unknown>>;
  alerts: FarmerAlert[];
  expenses: Array<Record<string, unknown>>;
  weather: WeatherData | null;
  weatherAvailable: boolean;
  market: Array<Record<string, unknown>>;
  marketAvailable: boolean;
  yield: Array<Record<string, unknown>>;
  yieldAvailable: boolean;
  assembled: string;
}

async function safeTable(table: string, userColumn: string, userId: string, limit = 20): Promise<Array<Record<string, unknown>>> {
  try {
    const { data, error } = await supabase.from(table).select('*').eq(userColumn, userId).order('created_at', { ascending: false }).limit(limit);
    if (error) return [];
    return (data ?? []) as Array<Record<string, unknown>>;
  } catch {
    return [];
  }
}

function compactRows(rows: Array<Record<string, unknown>>, fields: string[]) {
  return rows.map((row) => Object.fromEntries(fields.filter((field) => row[field] !== null && row[field] !== undefined).map((field) => [field, row[field]])));
}

function formatWeather(weather: WeatherData | null) {
  if (!weather) return 'Weather data: UNAVAILABLE. Do not infer or invent current weather.';
  const f = weather.forecast.slice(0, 5).map((day) => `${day.day}: ${day.condition}, ${day.tempLo}-${day.tempHi}°C, rain probability ${day.rainProbability ?? 'unknown'}%`).join('; ');
  return [
    `Weather source: live OpenWeather data for ${weather.location}.`,
    `Today: ${weather.today.temp}°C, ${weather.today.condition}, humidity ${weather.today.humidity}%, wind ${weather.today.wind} km/h, rain probability ${weather.today.rainProbability ?? 'unknown'}%.`,
    `Forecast: ${f || 'unavailable'}`,
  ].join('\n');
}

export async function buildCopilotContext(userId: string): Promise<CopilotContext> {
  const memory = await getFarmerMemory(userId);
  const [farms, crops, alerts, expensesResult, weatherResult, market, yieldRows] = await Promise.all([
    getFarms(userId).then((rows) => rows as unknown as Array<Record<string, unknown>>).catch(() => []),
    safeTable('crops', 'user_id', userId, 20),
    getAlerts(userId),
    getExpenses(userId).catch(() => ({ rows: [] })),
    (memory?.district || memory?.state)
      ? fetchWeather([memory.district, memory.state].filter(Boolean).join(', ')).catch(() => null)
      : Promise.resolve(null),
    safeTable('market_prices', 'user_id', userId, 20),
    safeTable('yield_predictions', 'user_id', userId, 20),
  ]);

  const expenseRows = expensesResult.rows.map((row) => ({
    date: row.date,
    category: row.category,
    amount: row.amount,
    description: row.description,
    field: row.field,
  }));

  const weatherAvailable = !!weatherResult;
  const marketAvailable = market.length > 0;
  const yieldAvailable = yieldRows.length > 0 || !!memory?.previous_yield_kg;

  const contextParts = [
    buildFarmerMemoryContext(memory),
    `Farm records:\n${JSON.stringify(compactRows(farms, ['name', 'location', 'crop', 'area', 'health', 'status', 'soil_type', 'village', 'district', 'irrigation_type', 'notes']))}`,
    `Crop records / health:\n${JSON.stringify(compactRows(crops, ['name', 'variety', 'field', 'area_acres', 'stage', 'health', 'planted_at', 'updated_at']))}`,
    `Recent alerts:\n${JSON.stringify(alerts.slice(0, 12).map((a) => ({ title: a.title, detail: a.detail, type: a.alert_type, severity: a.severity, live: a.is_live, created_at: a.created_at })))}`,
    `Recent expenses:\n${JSON.stringify(expenseRows.slice(0, 20))}`,
    formatWeather(weatherResult),
    marketAvailable
      ? `Market data source connected:\n${JSON.stringify(market.slice(0, 20))}`
      : 'Market data: UNAVAILABLE. Never state a current market price as fact.',
    yieldAvailable
      ? `Yield information:\n${JSON.stringify({ previous_yield_kg: memory?.previous_yield_kg ?? null, predictions: yieldRows.slice(0, 10) })}`
      : 'Yield information: UNAVAILABLE. Do not invent yield figures.',
  ].filter(Boolean);

  return {
    farmerMemory: memory,
    farms,
    crops,
    alerts,
    expenses: expenseRows,
    weather: weatherResult,
    weatherAvailable,
    market,
    marketAvailable,
    yield: yieldRows,
    yieldAvailable,
    assembled: `[LIVE FARM CONTEXT]\n${contextParts.join('\n\n')}`,
  };
}
