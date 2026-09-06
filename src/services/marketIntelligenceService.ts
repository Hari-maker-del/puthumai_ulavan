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
const GOVERNMENT_SOURCE = 'AGMARKNET / data.gov.in';

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

function normalizeDate(value: unknown): string | null {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, '0')}-${iso[3].padStart(2, '0')}`;

  const dmy = raw.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function normalizeText(value?: string | null) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sameDistrict(a?: string | null, b?: string | null) {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const aliases: Record<string, string> = {
    tirupur: 'tiruppur',
    tiruppur: 'tiruppur',
  };
  return (aliases[left] ?? left) === (aliases[right] ?? right);
}

function normalizeRow(
  row: Record<string, unknown>,
  source: string,
  index = 0,
  verified = true,
): MarketPrice | null {
  const crop = String(row.commodity ?? row.crop ?? '').trim();
  const price = Number(row.modal_price ?? row.price ?? 0);
  if (!crop || !Number.isFinite(price) || price <= 0) return null;

  const priceDate = normalizeDate(row.arrival_date ?? row.price_date ?? row.created_at);

  return {
    id: String(row.id ?? `${source}-${index}-${priceDate ?? ''}-${row.market ?? ''}`),
    crop,
    market: row.market ? String(row.market).trim() : null,
    district: row.district ? String(row.district).trim() : null,
    state: row.state ? String(row.state).trim() : null,
    price,
    minPrice: Number(row.min_price ?? 0) || null,
    maxPrice: Number(row.max_price ?? 0) || null,
    unit: row.unit ? String(row.unit) : '₹/quintal',
    price_date: priceDate,
    source,
    verified,
  };
}

async function fetchGovernmentRows(
  key: string,
  options: MarketIntelligenceFilter,
  includeDistrict: boolean,
  includeState: boolean,
): Promise<MarketPrice[]> {
  const params = new URLSearchParams({ 'api-key': key, format: 'json', offset: '0', limit: '100' });
  if (includeState && options.state) params.set('filters[state.keyword]', options.state);
  if (includeDistrict && options.district) params.set('filters[district]', options.district);
  const commodity = normalizeCommodity(options.crop);
  if (commodity) params.set('filters[commodity]', commodity);

  const response = await fetch(`${DATA_GOV_URL}?${params}`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Market service authentication failed. Check VITE_DATA_GOV_API_KEY in Vercel.');
    }
    throw new Error(`Government market data request failed with status ${response.status}.`);
  }

  const payload = await response.json() as { records?: Record<string, unknown>[] };
  return (payload.records ?? [])
    .map((row, index) => normalizeRow(row, GOVERNMENT_SOURCE, index, true))
    .filter((row): row is MarketPrice => row !== null)
    .filter((row) => !options.market || row.market?.toLowerCase() === options.market.toLowerCase())
    .sort((a, b) => (b.price_date ?? '').localeCompare(a.price_date ?? ''));
}

async function getGovernmentPrices(options: MarketIntelligenceFilter): Promise<{ prices: MarketPrice[]; broaderSearch: boolean }> {
  const key = String(import.meta.env.VITE_DATA_GOV_API_KEY ?? '').trim();
  if (!key) {
    throw new Error('Government market data is not configured. Add VITE_DATA_GOV_API_KEY to the Vercel Production environment and redeploy.');
  }

  // First try the exact farmer-selected crop + state + district.
  let prices = await fetchGovernmentRows(key, options, Boolean(options.district), Boolean(options.state));
  if (prices.length) return { prices, broaderSearch: false };

  // Government records sometimes use a different district spelling. Retry by state + crop,
  // then keep only the requested district when an equivalent spelling is present.
  if (options.district && options.state) {
    const statePrices = await fetchGovernmentRows(key, options, false, true);
    const districtMatches = statePrices.filter((row) => sameDistrict(row.district, options.district));
    if (districtMatches.length) return { prices: districtMatches, broaderSearch: false };
    if (statePrices.length) return { prices: statePrices, broaderSearch: true };
  }

  // Last fallback: crop-only government search. Returned rows retain their real market and
  // district so the UI never presents them as local prices.
  if (options.state) {
    prices = await fetchGovernmentRows(key, options, false, false);
    if (prices.length) return { prices, broaderSearch: true };
  }

  return { prices: [], broaderSearch: false };
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
    .map((row, index) => normalizeRow(row, row.source ? String(row.source) : 'Verified Supabase record', index, true))
    .filter((row): row is MarketPrice => row !== null);
}

/** Load Government of India mandi prices first, then fall back to verified Supabase records. */
export async function getMarketIntelligence(
  filter: MarketIntelligenceFilter = {},
): Promise<MarketIntelligenceResult> {
  try {
    const government = await getGovernmentPrices(filter);
    if (government.prices.length) {
      return {
        prices: government.prices,
        source: 'government',
        sourceLabel: government.broaderSearch
          ? 'AGMARKNET / Government of India — broader crop/state results'
          : 'AGMARKNET / Government of India',
      };
    }
  } catch (error) {
    if (String(error).includes('authentication failed') || String(error).includes('not configured')) throw error;
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
    if (government.prices.length) return government.prices;
  } catch (error) {
    if (String(error).includes('authentication failed') || String(error).includes('not configured')) throw error;
  }

  let query = supabase
    .from('market_prices')
    .select('id,user_id,crop,market,district,state,price,unit,price_date,source,is_verified,created_at')
    .eq('user_id', userId)
    .eq('is_verified', true)
    .order('price_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (crop) query = query.ilike('crop', crop);
  if (district) query = query.ilike('district', district);
  if (state) query = query.ilike('state', state);

  const { data, error } = await query;
  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row, index) => normalizeRow(row, row.source ? String(row.source) : 'Verified user-linked market record', index, true))
    .filter((row): row is MarketPrice => row !== null);
}
