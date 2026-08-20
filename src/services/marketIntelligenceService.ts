import { supabase } from '@/lib/supabase';

export interface MarketPrice {
  id?: string;
  crop: string;
  market?: string | null;
  district?: string | null;
  price: number;
  unit?: string | null;
  price_date?: string | null;
  source?: string | null;
}

export async function getMarketPrices(userId: string, crop?: string): Promise<MarketPrice[]> {
  try {
    let query = supabase
      .from('market_prices')
      .select('*')
      .eq('user_id', userId)
      .order('price_date', { ascending: false })
      .limit(50);

    if (crop) query = query.ilike('crop', crop);

    const { data, error } = await query;
    if (error || !data) return [];

    return (data as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id ?? ''),
      crop: String(row.crop ?? ''),
      market: row.market ? String(row.market) : null,
      district: row.district ? String(row.district) : null,
      price: Number(row.price ?? 0),
      unit: row.unit ? String(row.unit) : '₹/quintal',
      price_date: row.price_date ? String(row.price_date) : null,
      source: row.source ? String(row.source) : null,
    })).filter((row) => row.crop && Number.isFinite(row.price));
  } catch {
    return [];
  }
}
