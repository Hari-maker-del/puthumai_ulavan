import { supabase } from '@/lib/supabase';
import { askGeminiWithImage } from '@/services/geminiService';
import type { ScannerRequest, ScannerResponse, ScanResult, CropScanHistoryRow } from '@/services/types';

const LOCAL_HISTORY_PREFIX = 'puthumai-ulavan:crop-scans:';

function parseJsonFromGemini(responseText: string): string {
  const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/i);
  const candidate = jsonBlockMatch ? jsonBlockMatch[1] : responseText;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);
  if (!objectMatch) throw new Error('Gemini response did not include valid JSON.');
  return objectMatch[0];
}

function normalizeSeverity(value: unknown): ScanResult['severity'] {
  const severity = String(value ?? '').trim().toLowerCase();
  if (severity === 'high') return 'High';
  if (severity === 'moderate') return 'Moderate';
  if (severity === 'low') return 'Low';
  return 'None';
}

function normalizeStatus(disease: string | null, severity: ScanResult['severity']): ScanResult['status'] {
  if (disease) return 'Action needed';
  return severity === 'None' ? 'Healthy' : 'Action needed';
}

function parseGeminiScanResponse(responseText: string, crop: string, field: string): ScannerResponse {
  const parsed = JSON.parse(parseJsonFromGemini(responseText)) as Record<string, unknown>;
  const disease = parsed.disease === null ? null : String(parsed.disease ?? '').trim() || null;
  const diseaseConfidence = Number(parsed.disease_confidence ?? parsed.diseaseConfidence ?? 0);
  const nutrientDeficiency = String(parsed.nutrient_deficiency ?? parsed.nutrientDeficiency ?? 'None').trim();
  const nutrientConfidence = Number(parsed.nutrient_confidence ?? parsed.nutrientConfidence ?? 0);
  const waterStress = String(parsed.water_stress ?? parsed.waterStress ?? 'None').trim();
  const waterConfidence = Number(parsed.water_confidence ?? parsed.waterConfidence ?? 0);
  const pestRisk = String(parsed.pest_risk ?? parsed.pestRisk ?? 'None').trim();
  const pestConfidence = Number(parsed.pest_confidence ?? parsed.pestConfidence ?? 0);
  const recommendation = String(parsed.recommendation ?? parsed.treatment ?? 'Review the field and consult an agronomist.').trim();
  const overallConfidence = Number(parsed.overall_confidence ?? parsed.overallConfidence ?? parsed.confidence ?? 0);
  const severity = normalizeSeverity(parsed.severity ?? (disease ? 'Moderate' : 'None'));
  const status = normalizeStatus(disease, severity);

  return {
    result: {
      crop,
      field,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      disease,
      confidence: Math.round(Math.min(100, Math.max(0, overallConfidence || diseaseConfidence || 0))),
      severity,
      treatment: recommendation,
      status,
    },
    analysis: {
      disease,
      diseaseConfidence: Math.round(Math.min(100, Math.max(0, diseaseConfidence || overallConfidence || 0))),
      nutrientDeficiency,
      nutrientConfidence: Math.round(Math.min(100, Math.max(0, nutrientConfidence))),
      waterStress: ['None', 'Low', 'Moderate', 'High'].includes(waterStress) ? (waterStress as ScanResult['severity']) : 'None',
      waterConfidence: Math.round(Math.min(100, Math.max(0, waterConfidence))),
      pestRisk: ['None', 'Low', 'Moderate', 'High'].includes(pestRisk) ? (pestRisk as ScanResult['severity']) : 'None',
      pestConfidence: Math.round(Math.min(100, Math.max(0, pestConfidence))),
      recommendation,
      overallConfidence: Math.round(Math.min(100, Math.max(0, overallConfidence || diseaseConfidence || 0))),
    },
  };
}

function buildScanPrompt(crop: string, field: string) {
  return `Analyze the attached leaf image from a ${crop} field named "${field}". Provide only valid JSON with exactly these keys:\n` +
    `{"disease": string | null, "disease_confidence": number, "nutrient_deficiency": string, "nutrient_confidence": number, "water_stress": "None" | "Low" | "Moderate" | "High", "water_confidence": number, "pest_risk": "None" | "Low" | "Moderate" | "High", "pest_confidence": number, "recommendation": string, "overall_confidence": number, "severity": "None" | "Low" | "Moderate" | "High"}\n` +
    `If there is no disease, set "disease" to null and "severity" to "None". Do not include any extra text outside the JSON object.`;
}

function isCropScansTableUnavailable(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; details?: string } | null;
  const text = `${candidate?.code ?? ''} ${candidate?.message ?? ''} ${candidate?.details ?? ''}`.toLowerCase();
  return candidate?.code === 'PGRST205' || candidate?.code === '42P01' || text.includes('crop_scans') && (text.includes('schema cache') || text.includes('does not exist') || text.includes('not found'));
}

function localHistoryKey(userId: string): string {
  return `${LOCAL_HISTORY_PREFIX}${userId}`;
}

function readLocalHistory(userId: string): CropScanHistoryRow[] {
  try {
    const raw = localStorage.getItem(localHistoryKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CropScanHistoryRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(userId: string, scan: ScanResult): CropScanHistoryRow {
  const row: CropScanHistoryRow = {
    ...scan,
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    user_id: userId,
    created_at: new Date().toISOString(),
  };
  try {
    const rows = [row, ...readLocalHistory(userId)].slice(0, 50);
    localStorage.setItem(localHistoryKey(userId), JSON.stringify(rows));
  } catch {
    // Keep the scan result usable even when browser storage is unavailable.
  }
  return row;
}

export async function scanCrop(payload: ScannerRequest): Promise<ScannerResponse> {
  try {
    const responseText = await askGeminiWithImage(buildScanPrompt(payload.crop, payload.field), payload.imageData);
    return parseGeminiScanResponse(responseText, payload.crop, payload.field);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Crop health analysis failed.';
    throw new Error(`Crop health analysis unavailable: ${message}`);
  }
}

export async function saveCropScanHistory(userId: string, scan: ScanResult): Promise<void> {
  const { error } = await supabase.from('crop_scans').insert({
    user_id: userId,
    crop: scan.crop,
    field: scan.field,
    disease: scan.disease,
    confidence: scan.confidence,
    severity: scan.severity,
    treatment: scan.treatment,
    status: scan.status,
    date: scan.date,
  });

  if (!error) return;

  // A missing Supabase table must not prevent the AI scanner from working.
  // Keep the result locally until the database migration is applied.
  if (isCropScansTableUnavailable(error)) {
    writeLocalHistory(userId, scan);
    return;
  }
  throw new Error(error.message);
}

export async function getCropScanHistory(userId: string): Promise<CropScanHistoryRow[]> {
  const { data, error } = await supabase
    .from('crop_scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(8);

  if (!error) {
    return (data ?? []).map((row) => ({
      id: String((row as Partial<CropScanHistoryRow> & Record<string, unknown>).id ?? ''),
      user_id: String((row as Partial<CropScanHistoryRow> & Record<string, unknown>).user_id ?? ''),
      crop: String((row as Record<string, unknown>).crop ?? 'Unknown'),
      field: String((row as Record<string, unknown>).field ?? 'Field'),
      date: String((row as Record<string, unknown>).date ?? new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })),
      disease: (row as Record<string, unknown>).disease === null ? null : String((row as Record<string, unknown>).disease ?? 'None'),
      confidence: Number((row as Record<string, unknown>).confidence ?? 0),
      severity: normalizeSeverity((row as Record<string, unknown>).severity ?? 'None'),
      treatment: String((row as Record<string, unknown>).treatment ?? 'No recommendation available.'),
      status: String((row as Record<string, unknown>).status ?? 'Healthy') as ScanResult['status'],
      created_at: (row as Record<string, unknown>).created_at ? String((row as Record<string, unknown>).created_at) : undefined,
    }));
  }

  if (isCropScansTableUnavailable(error)) return readLocalHistory(userId);
  throw new Error(error.message);
}
