import { supabase } from '@/lib/supabase';

export interface MarketPrice {
  id?: string;
  crop: string;
  market?: string | null;
  district?: string | null;
  state?: string | null;
  price: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  unit?: string | null;
  price_date?: string | null;
  source?: string | null;
  verified?: boolean;
}

export interface MarketIntelligenceFilter {
  crop?: string | null;
  district?: string | null;
  state?: string | null;
  market?: string | null;
}

export type MarketDataSource = 'government' | 'supabase' | 'none';

export interface MarketIntelligenceResult {
  prices: MarketPrice[];
  source: MarketDataSource;
  sourceLabel: string;
}

const DATA_GOV_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

function normalizeCommodity(crop?: string | null) {
  const value = (crop ?? '').trim().toLowerCase();
  const map: Record<string, string> = {
    paddy: 'Rice', rice: 'Rice', groundnut: 'Groundnut', peanut: 'Groundnut', maize: 'Maize', corn: 'Maize',
    cotton: 'Cotton', sugarcane: 'Sugarcane', tomato: 'Tomato', onion: 'Onion', 'black gram': 'Black Gram',
    urad: 'Black Gram', chickpea: 'Gram', bengalgram: 'Gram', sorghum: 'Jowar', millet: 'Millets',
    banana: 'Banana', wheat: 'Wheat', turmeric: 'Turmeric', chilli: 'Chillies',
  };
  return map[value] ?? crop?.trim() ?? null;
}

function normalizeRow(row: Record<string, unknown>, source: string, index = 0): MarketPrice | null {
  const crop = String(row.commodity ?? row.crop ?? '').trim();
  const price = Number(row.modal_price ?? row.price ?? 0);
  if (!crop || !Number.isFinite(price) || price <= 0) return null;

  return {
    id: String(row.id ?? `${source}-${index}-${row.arrival_date ?? row.price_date ?? ''}-${row.market ?? ''}`),
    crop,
    market: row.market ? String(row.market).trim() : null,
    district: row.district ? String(row.district).trim() : null,
    state: row.state ? String(row.state).trim() : null,
    price,
    minPrice: Number(row.min_price ?? 0) || null,
    maxPrice: Number(row.max_price ?? 0) || null,
    unit: row.unit ? String(row.unit) : '₹/quintal',
    price_date: row.arrival_date ? String(row.arrival_date) : row.price_date ? String(row.price_date) : null,
    source,
    verified: true,
  };
}

async function getGovernmentPrices(options: MarketIntelligenceFilter): Promise<MarketPrice[]> {
  const key = String(import.meta.env.VITE_DATA_GOV_API_KEY ?? '').trim();
  if (!key) return [];

  const params = new URLSearchParams({ 'api-key': key, format: 'json', offset: '0', limit: '100' });
  if (options.state) params.set('filters[state.keyword]', options.state);
  if (options.district) params.set('filters[district]', options.district);
  const commodity = normalizeCommodity(options.crop);
  if (commodity) params.set('filters[commodity]', commodity);

  const response = await fetch(`${DATA_GOV_URL}?${params}`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Market service authentication failed. Check VITE_DATA_GOV_API_KEY.');
    }
    throw new Error(`Government market data request failed with status ${response.status}.`);
  }

  const payload = await response.json() as { records?: Record<string, unknown>[] };
  const rows = payload.records ?? [];
  return rows.map((row, index) => normalizeRow(row, 'AGMARKNET / data.gov.in', index))
    .filter((row): row is MarketPrice => row !== null)
    .filter((row) => !options.market || row.market?.toLowerCase() === options.market.toLowerCase());
}

async function getVerifiedSupabasePrices(options: MarketIntelligenceFilter): Promise<MarketPrice[]> {
  let query = supabase
    .from('market_prices')
    .select('id,user_id,crop,market,district,state,price,unit,price_date,source,is_verified,created_at')
    .eq('is_verified', true)
    .order('price_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (options.crop) query = query.ilike('crop', options.crop);
  if (options.district) query = query.ilike('district', options.district);
  if (options.state) query = query.ilike('state', options.state);
  if (options.market) query = query.ilike('market', options.market);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row, index) => normalizeRow(row, row.source ? String(row.source) : 'Verified Supabase record', index))
    .filter((row): row is MarketPrice => row !== null);
}

/** Load Government of India mandi prices first, then fall back to verified Supabase records. */
export async function getMarketIntelligence(
  filter: MarketIntelligenceFilter = {},
): Promise<MarketIntelligenceResult> {
  try {
    const government = await getGovernmentPrices(filter);
    if (government.length) {
      return { prices: government, source: 'government', sourceLabel: 'AGMARKNET / Government of India' };
    }
  } catch (error) {
    if (String(error).includes('authentication failed')) throw error;
  }

  const verified = await getVerifiedSupabasePrices(filter);
  if (verified.length) {
    return { prices: verified, source: 'supabase', sourceLabel: 'Verified Puthumai Uzhavan market records' };
  }

  return { prices: [], source: 'none', sourceLabel: 'No verified market data available' };
}

/** Existing crop-service/AI compatibility API. */
export async function getMarketPrices(
  userId: string,
  crop?: string,
  district?: string | null,
  state?: string | null,
): Promise<MarketPrice[]> {
  try {
    const government = await getGovernmentPrices({ crop, district, state });
    if (government.length) return government;
  } catch (error) {
    if (String(error).includes('authentication failed')) throw error;
  }

  let query = supabase
    .from('market_prices')
    .select('id,user_id,crop,market,district,state,price,unit,price_date,source,is_verified,created_at')
    .eq('user_id', userId)
    .order('price_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (crop) query = query.ilike('crop', crop);
  if (district) query = query.ilike('district', district);
  if (state) query = query.ilike('state', state);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row, index) => normalizeRow(row, row.source ? String(row.source) : 'User-linked market record', index))
    .filter((row): row is MarketPrice => row !== null && Boolean(row.verified));
}
