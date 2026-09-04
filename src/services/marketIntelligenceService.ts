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

const DATA_GOV_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

function normalizeCommodity(crop?: string | null) {
  const value = (crop ?? '').trim().toLowerCase();
  const map: Record<string,string> = {
    paddy:'Rice', rice:'Rice', groundnut:'Groundnut', peanut:'Groundnut', maize:'Maize', corn:'Maize',
    cotton:'Cotton', sugarcane:'Sugarcane', tomato:'Tomato', onion:'Onion', 'black gram':'Black Gram',
    urad:'Black Gram', chickpea:'Gram', bengalgram:'Gram', sorghum:'Jowar', millet:'Millets',
  };
  return map[value] ?? crop?.trim() ?? null;
}

async function getGovernmentPrices(options: { crop?: string|null; district?: string|null; state?: string|null }) {
  const key = String(import.meta.env.VITE_DATA_GOV_API_KEY ?? '').trim();
  if (!key) return [] as MarketPrice[];
  const params = new URLSearchParams({ 'api-key': key, format: 'json', offset: '0', limit: '50' });
  if (options.state) params.set('filters[state.keyword]', options.state);
  if (options.district) params.set('filters[district]', options.district);
  const commodity = normalizeCommodity(options.crop);
  if (commodity) params.set('filters[commodity]', commodity);

  const response = await fetch(`${DATA_GOV_URL}?${params}`);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error('Market service authentication failed. Check VITE_DATA_GOV_API_KEY.');
    throw new Error(`Government market data request failed with status ${response.status}.`);
  }
  const payload = await response.json() as { records?: Record<string, unknown>[] };
  return (payload.records ?? []).map((row, index) => ({
    id: `data-gov-${index}-${String(row.arrival_date ?? '')}-${String(row.market ?? '')}`,
    crop: String(row.commodity ?? commodity ?? ''),
    market: row.market ? String(row.market) : null,
    district: row.district ? String(row.district) : null,
    state: row.state ? String(row.state) : null,
    price: Number(row.modal_price ?? 0),
    minPrice: Number(row.min_price ?? 0),
    maxPrice: Number(row.max_price ?? 0),
    unit: '₹/quintal',
    price_date: row.arrival_date ? String(row.arrival_date) : null,
    source: 'AGMARKNET / data.gov.in',
    verified: true,
  })).filter(row => row.crop && Number.isFinite(row.price) && row.price > 0);
}

async function getVerifiedSupabasePrices(_userId: string, crop?: string) {
  let query = supabase.from('market_prices').select('*').order('price_date', { ascending: false }).limit(50);
  if (crop) {
    const normalized = normalizeCommodity(crop);
    query = query.ilike('crop', normalized ?? crop);
  }
  const { data, error } = await query;
  if (error || !data) return [] as MarketPrice[];
  return (data as Array<Record<string,unknown>>).map(row => ({
    id: String(row.id ?? ''), crop: String(row.crop ?? ''), market: row.market ? String(row.market) : null,
    district: row.district ? String(row.district) : null, state: row.state ? String(row.state) : null,
    price: Number(row.price ?? 0), minPrice: null, maxPrice: null, unit: row.unit ? String(row.unit) : '₹/quintal',
    price_date: row.price_date ? String(row.price_date) : null, source: row.source ? String(row.source) : 'Supabase verified record',
    verified: Boolean(row.is_verified),
  })).filter(row => row.crop && row.verified && Number.isFinite(row.price) && row.price > 0);
}

export async function getMarketPrices(userId: string, crop?: string, district?: string | null, state?: string | null): Promise<MarketPrice[]> {
  try {
    const government = await getGovernmentPrices({ crop, district, state });
    if (government.length) return government;
  } catch (error) {
    // Preserve a usable verified Supabase source if the external source is unavailable.
    if (String(error).includes('authentication failed')) throw error;
  }
  return getVerifiedSupabasePrices(userId, crop);
}
