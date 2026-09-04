import { askGemini } from '@/services/geminiService';
import type { CropRecommendRequest, CropRecommendation } from '@/services/types';
import type { WeatherData } from '@/services/weatherService';
import type { MarketPrice } from '@/services/marketIntelligenceService';

const COLORS: Record<string, string> = {
  Paddy: '#22c55e',
  'Black Gram': '#1f2937',
  Maize: '#f59e0b',
  Groundnut: '#f97316',
  Sugarcane: '#0ea5e9',
  Tomato: '#ef4444',
  Cotton: '#8b5cf6',
  Millets: '#84cc16',
};

const ALLOWED_CROPS = Object.keys(COLORS);

function marketCropKey(value: string) {
  const key = value.trim().toLowerCase();
  const aliases: Record<string, string> = {
    paddy: 'rice', rice: 'rice',
    urad: 'black gram', 'black gram': 'black gram',
    peanut: 'groundnut', groundnut: 'groundnut',
    corn: 'maize', maize: 'maize',
  };
  return aliases[key] ?? key;
}

function parseJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fenced?.[1] ?? text;
  const object = candidate.match(/\{[\s\S]*\}/);
  if (!object) throw new Error('AI recommendation did not return valid JSON.');
  try {
    return JSON.parse(object[0]);
  } catch {
    // Log the raw response in development so format issues are easy to trace.
    if (import.meta.env.DEV) {
      console.warn('[cropRecommendationAI] Failed to parse Gemini response:', text);
    }
    throw new Error('AI recommendation returned malformed JSON. Please try again.');
  }
}

function clamp(value: unknown, min = 0, max = 100) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : 0;
}

function normalizeList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean).slice(0, 6) : [];
}

function normalizeRecommendation(
  raw: Record<string, unknown>,
  market: MarketPrice[],
): CropRecommendation | null {
  const crop = String(raw.crop ?? '').trim();
  if (!ALLOWED_CROPS.includes(crop)) {
    // Gracefully skip unknown crops instead of throwing — allows the remaining
    // valid crops in the batch to still be returned to the farmer.
    if (import.meta.env.DEV) {
      console.warn(`[cropRecommendationAI] Skipping unsupported crop from AI: "${crop}"`);
    }
    return null;
  }

  const marketRows = market.filter((row) => marketCropKey(row.crop) === marketCropKey(crop));
  const hasVerifiedMarket = marketRows.length > 0;
  const min = hasVerifiedMarket ? Math.min(...marketRows.map((row) => row.minPrice ?? row.price)) : 0;
  const max = hasVerifiedMarket ? Math.max(...marketRows.map((row) => row.maxPrice ?? row.price)) : 0;

  return {
    crop,
    variety: String(raw.variety ?? 'Variety not specified'),
    confidence: Math.round(clamp(raw.confidence)),
    expectedYield: String(raw.expectedYield ?? 'Unavailable'),
    expectedRevenue: hasVerifiedMarket ? clamp(raw.expectedRevenue, 0, 1_000_000_000) : 0,
    expectedProfit: hasVerifiedMarket ? clamp(raw.expectedProfit, 0, 1_000_000_000) : 0,
    marketDemand: ['High', 'Medium', 'Low'].includes(String(raw.marketDemand))
      ? raw.marketDemand as CropRecommendation['marketDemand'] : 'Medium',
    waterRequirement: ['Low', 'Medium', 'High'].includes(String(raw.waterRequirement))
      ? raw.waterRequirement as CropRecommendation['waterRequirement'] : 'Medium',
    growingDuration: String(raw.growingDuration ?? 'Not specified'),
    riskLevel: ['Low', 'Medium', 'High'].includes(String(raw.riskLevel))
      ? raw.riskLevel as CropRecommendation['riskLevel'] : 'Medium',
    reason: String(raw.reason ?? 'Recommendation generated from the supplied farm conditions.'),
    color: COLORS[crop],
    benefits: normalizeList(raw.benefits),
    disadvantages: normalizeList(raw.disadvantages),
    growingSteps: normalizeList(raw.growingSteps),
    fertilizer: String(raw.fertilizer ?? 'Follow soil-test and local agronomy guidance.'),
    irrigation: String(raw.irrigation ?? 'Follow crop-stage water requirements.'),
    harvestTime: String(raw.harvestTime ?? 'Not specified'),
    marketPrice: hasVerifiedMarket
      ? `₹${Math.round(min)}–${Math.round(max)} / quintal`
      : 'Unavailable — no verified market record',
  };
}

export async function generateAICropRecommendations(
  payload: CropRecommendRequest,
  weather: WeatherData | null,
  market: MarketPrice[],
  farmRows: Array<Record<string, unknown>>,
): Promise<CropRecommendation[]> {
  const verifiedMarket = market.filter((row) => row.verified && row.price > 0);
  const prompt = `
Return only JSON. You are the crop recommendation model for an Indian farmer.
Recommend exactly 5 distinct crops from this allowed list: ${ALLOWED_CROPS.join(', ')}.
Rank them from best to worst for the supplied farmer.

FARM INPUT
${JSON.stringify(payload)}

FARM RECORDS
${JSON.stringify(farmRows.slice(0, 10))}

LIVE WEATHER
${weather ? JSON.stringify({ location: weather.location, source: weather.source, today: weather.today, forecast: weather.forecast.slice(0, 5) }) : 'UNAVAILABLE'}

VERIFIED MARKET RECORDS
${JSON.stringify(verifiedMarket.slice(0, 30))}

Truth rules:
- Use only the supplied farm, weather and market data plus agricultural knowledge.
- Never invent a current market price.
- If verified market records are unavailable for a crop, set expectedRevenue and expectedProfit to 0.
- Set confidence as suitability confidence, not certainty.
- Do not claim guaranteed profit or guaranteed yield.
- Keep the recommendation actionable and farmer-friendly.
- Only use crops from the allowed list above. Do not suggest any other crop names.

JSON schema:
{
  "recommendations": [
    {
      "crop": "string",
      "variety": "string",
      "confidence": 0,
      "expectedYield": "string",
      "expectedRevenue": 0,
      "expectedProfit": 0,
      "marketDemand": "High|Medium|Low",
      "waterRequirement": "Low|Medium|High",
      "growingDuration": "string",
      "riskLevel": "Low|Medium|High",
      "reason": "string",
      "benefits": ["string"],
      "disadvantages": ["string"],
      "growingSteps": ["string"],
      "fertilizer": "string",
      "irrigation": "string",
      "harvestTime": "string"
    }
  ]
}`;

  const text = await askGemini(prompt);
  const parsed = parseJson(text) as { recommendations?: unknown };
  if (!Array.isArray(parsed.recommendations) || parsed.recommendations.length < 3) {
    throw new Error('AI recommendation returned an incomplete result. Please try again.');
  }

  const unique = new Set<string>();
  const recommendations = (parsed.recommendations as Record<string, unknown>[])
    .map((item) => normalizeRecommendation(item, verifiedMarket))
    .filter((item): item is CropRecommendation => {
      if (!item) return false;
      if (unique.has(item.crop)) return false;
      unique.add(item.crop);
      return true;
    })
    .slice(0, 5)
    .map((item, index) => ({ ...item, best: index === 0 }));

  if (recommendations.length < 3) {
    throw new Error('AI recommendation returned too few valid crops. Please try again.');
  }
  return recommendations;
}
