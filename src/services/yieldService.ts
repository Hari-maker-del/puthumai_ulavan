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

function cleanConfidence(value: unknown): number {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return 0;
  return Math.min(100, Math.max(0, Math.round(confidence)));
}

export async function predictYield(payload: YieldRequest): Promise<YieldResponse> {
  if (!payload.userId) throw new Error('Sign in to generate a farm-specific yield prediction.');

  const fieldName = payload.field.trim();
  const cropName = payload.crop.trim();
  const area = Number(payload.area);
  if (!fieldName || !cropName || !Number.isFinite(area) || area <= 0) {
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

  const matchedField = fields.find((item) => String(item.name ?? '').trim().toLowerCase() === fieldName.toLowerCase());
  const matchedFarmId = matchedField?.farm_id ? String(matchedField.farm_id) : null;
  const location = matchedFarmId
    ? String(farms.find((farm) => String(farm.id) === matchedFarmId)?.location ?? 'UNAVAILABLE')
    : String(farms[0]?.location ?? farms[0]?.district ?? 'UNAVAILABLE');

  let weather: unknown = 'UNAVAILABLE';
  try {
    const { fetchWeather } = await import('@/services/weatherService');
    weather = await fetchWeather(location);
  } catch {
    weather = 'UNAVAILABLE';
  }

  const prompt = `Return only JSON. Generate a conservative farm-specific yield estimate from the supplied records.

REQUEST: ${JSON.stringify({ field: fieldName, crop: cropName, area, userId: payload.userId })}
MATCHED FIELD: ${JSON.stringify(matchedField ?? null)}
FARMS: ${JSON.stringify(farms.slice(0, 10))}
FIELDS: ${JSON.stringify(fields.slice(0, 20))}
CROP RECORDS: ${JSON.stringify((cropRows.data ?? []).slice(0, 20))}
PREVIOUS PREDICTIONS: ${JSON.stringify((previousPredictions.data ?? []).slice(0, 20))}
WEATHER: ${JSON.stringify(weather)}

Rules:
- Use only the supplied farmer records, requested crop/field/area, and supplied weather.
- Never invent historical yield, farm size, crop history, or measured production.
- A previous model prediction is an estimate, not an actual historical yield.
- If there is no actual historical yield in the supplied records, say so in the explanation.
- Do not present an estimate as guaranteed or laboratory-validated.
- Confidence must reflect uncertainty and must be between 0 and 100.
- predicted must be a non-negative number in the selected unit.

Schema: {"predicted":0,"confidence":0,"unit":"kg","explanation":"string"}`;

  const result = parseJson(await askGemini(prompt));
  const predicted = Number(result.predicted);
  const confidence = cleanConfidence(result.confidence);
  const unit = String(result.unit ?? 'kg').trim() || 'kg';
  const explanation = String(result.explanation ?? '').trim();

  if (!Number.isFinite(predicted) || predicted < 0 || !Number.isFinite(Number(result.confidence))) {
    throw new Error('Yield model returned invalid prediction values.');
  }
  if (!explanation) {
    throw new Error('Yield model did not provide an explanation for the estimate.');
  }

  const field: YieldField = {
    field: fieldName,
    crop: cropName,
    area: `${area} ac`,
    predicted: Math.round(predicted),
    lastSeason: 0,
    confidence,
    unit,
  };

  const insertResult = await supabase.from('yield_predictions').insert({
    user_id: payload.userId,
    farm_id: matchedFarmId,
    field_name: fieldName,
    crop: cropName,
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
