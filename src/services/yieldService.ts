import { supabase } from '@/lib/supabase';
import { askGemini } from '@/services/geminiService';
import type { YieldField, YieldRequest, YieldResponse } from '@/services/types';

function parseJson(text: string): Record<string, unknown> {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text;
  const object = candidate.match(/\{[\s\S]*\}/);
  if (!object) throw new Error('Yield model did not return valid JSON.');
  return JSON.parse(object[0]) as Record<string, unknown>;
}

export async function predictYield(payload: YieldRequest): Promise<YieldResponse> {
  if (!payload.userId) throw new Error('Sign in to generate a farm-specific yield prediction.');

  const area = Number(payload.area);
  if (!payload.field.trim() || !payload.crop.trim() || !Number.isFinite(area) || area <= 0) {
    throw new Error('Field, crop and a positive area are required.');
  }

  const farmsResult = await supabase.from('farms').select('*').eq('user_id', payload.userId).limit(20);
  if (farmsResult.error) throw new Error(farmsResult.error.message);
  const farms = (farmsResult.data ?? []) as Array<Record<string, unknown>>;
  const farmIds = farms.map((farm) => String(farm.id)).filter(Boolean);

  let fields: Array<Record<string, unknown>> = [];
  if (farmIds.length) {
    const fieldsResult = await supabase.from('fields').select('*').in('farm_id', farmIds).limit(100);
    if (fieldsResult.error) throw new Error(fieldsResult.error.message);
    fields = (fieldsResult.data ?? []) as Array<Record<string, unknown>>;
  }

  const [cropRows, previousPredictions] = await Promise.all([
    supabase.from('crops').select('*').eq('user_id', payload.userId).order('created_at', { ascending: false }).limit(30),
    supabase.from('yield_predictions').select('*').eq('user_id', payload.userId).order('created_at', { ascending: false }).limit(30),
  ]);
  if (cropRows.error) throw new Error(cropRows.error.message);
  if (previousPredictions.error) throw new Error(previousPredictions.error.message);

  const location = String(farms[0]?.location ?? farms[0]?.district ?? 'Tamil Nadu');
  let weather: unknown = 'UNAVAILABLE';
  try {
    const { fetchWeather } = await import('@/services/weatherService');
    weather = await fetchWeather(location);
  } catch {
    weather = 'UNAVAILABLE';
  }

  const prompt = `Return only JSON. Generate a transparent, farm-specific yield estimate using the supplied records.

REQUEST: ${JSON.stringify(payload)}
FARMS: ${JSON.stringify(farms.slice(0, 10))}
FIELDS: ${JSON.stringify(fields.slice(0, 20))}
CROP RECORDS: ${JSON.stringify((cropRows.data ?? []).slice(0, 20))}
PREVIOUS MODEL PREDICTIONS: ${JSON.stringify((previousPredictions.data ?? []).slice(0, 20))}
WEATHER: ${JSON.stringify(weather)}

Rules: never invent a historical yield; if no historical yield exists, state that in the explanation. Return a conservative estimate, confidence 0-100, and unit (usually kg). Do not claim the result is a laboratory-validated model.

Schema: {"predicted":0,"confidence":0,"unit":"kg","explanation":"string"}`;

  const result = parseJson(await askGemini(prompt));
  const predicted = Number(result.predicted);
  const confidence = Number(result.confidence);
  if (!Number.isFinite(predicted) || predicted < 0 || !Number.isFinite(confidence)) {
    throw new Error('Yield model returned invalid prediction values.');
  }

  const field: YieldField = {
    field: payload.field.trim(),
    crop: payload.crop.trim(),
    area: `${area} ac`,
    predicted: Math.round(predicted),
    lastSeason: 0,
    confidence: Math.min(100, Math.max(0, Math.round(confidence))),
    unit: String(result.unit ?? 'kg'),
  };

  const matchedField = fields.find((item) => String(item.name ?? '').toLowerCase() === payload.field.trim().toLowerCase());
  const matchedFarmId = matchedField?.farm_id ? String(matchedField.farm_id) : null;
  const insertResult = await supabase.from('yield_predictions').insert({
    user_id: payload.userId,
    farm_id: matchedFarmId,
    field_name: payload.field.trim(),
    crop: payload.crop.trim(),
    area_acres: area,
    predicted_yield: field.predicted,
    unit: field.unit,
    confidence: field.confidence,
    model: 'Gemini farm-aware yield estimator',
  });
  if (insertResult.error) throw new Error(insertResult.error.message);

  const trend = (previousPredictions.data ?? []).slice(0, 6).reverse().map((row) => ({
    month: new Date(String(row.created_at)).toLocaleDateString('en-IN', { month: 'short' }),
    actual: null,
    predicted: Number(row.predicted_yield ?? 0),
  }));

  return { fields: [field], trend };
}
