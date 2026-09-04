import { supabase } from '@/lib/supabase';
import type { CropRecommendRequest, CropRecommendResponse, RecommendationHistoryRow } from '@/services/types';

function normalizeRecommendation(row: Partial<RecommendationHistoryRow> & Record<string, unknown>): RecommendationHistoryRow {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    state: row.state ? String(row.state) : null,
    district: row.district ? String(row.district) : null,
    soil_type: row.soil_type ? String(row.soil_type) : null,
    season: row.season ? String(row.season) : null,
    land_size: row.land_size ? Number(row.land_size) : null,
    water_availability: row.water_availability ? String(row.water_availability) : null,
    previous_crop: row.previous_crop ? String(row.previous_crop) : null,
    recommended_crop: String(row.recommended_crop ?? 'Crop'),
    expected_yield: row.expected_yield ? String(row.expected_yield) : null,
    profit_estimate: row.profit_estimate ? Number(row.profit_estimate) : null,
    required_water: row.required_water ? String(row.required_water) : null,
    fertilizer_advice: row.fertilizer_advice ? String(row.fertilizer_advice) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
  };
}

export async function recommendCrops(payload: CropRecommendRequest): Promise<CropRecommendResponse> {
  if (!payload.userId) {
    throw new Error('Sign in to generate a farm-specific crop recommendation.');
  }

  const { generateAICropRecommendations } = await import('@/services/cropRecommendationAIService');

  const [farmsResult, weatherResult, marketResult] = await Promise.all([
    supabase.from('farms').select('*').eq('user_id', payload.userId).limit(10),
    import('@/services/weatherService').then(({ fetchWeather }) =>
      fetchWeather(payload.location).catch(() => null),
    ),
    import('@/services/marketIntelligenceService').then(({ getMarketPrices }) =>
      getMarketPrices(
        payload.userId!,
        null,
        payload.district ?? null,
        payload.location.split(',').at(-1)?.trim() ?? null,
      ).catch(() => []),
    ),
  ]);

  if (farmsResult.error) throw new Error(farmsResult.error.message);

  const recommendations = await generateAICropRecommendations(
    payload,
    weatherResult,
    marketResult,
    (farmsResult.data ?? []) as Array<Record<string, unknown>>,
  );

  return { recommendations };
}

export async function saveRecommendationHistory(userId: string, payload: CropRecommendRequest, recommendation: CropRecommendResponse['recommendations'][number]) {
  const { error } = await supabase.from('recommendations').insert({
    user_id: userId,
    state: payload.location?.split(',').pop()?.trim() || null,
    district: payload.district || null,
    soil_type: payload.soilType || null,
    season: payload.season || null,
    land_size: payload.farmArea || null,
    water_availability: payload.waterAvailability || null,
    previous_crop: payload.previousCrop || null,
    recommended_crop: recommendation.crop,
    expected_yield: recommendation.expectedYield,
    profit_estimate: recommendation.expectedProfit,
    required_water: recommendation.waterRequirement,
    fertilizer_advice: recommendation.reason,
  });

  if (error) throw new Error(error.message);
}

export async function getRecommendationHistory(userId: string): Promise<RecommendationHistoryRow[]> {
  const { data, error } = await supabase.from('recommendations').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => normalizeRecommendation(row as Partial<RecommendationHistoryRow> & Record<string, unknown>));
}

