export interface CropLifecycleRule {
  crop: string;
  durationDays: number;
  stages: Array<{ name: string; startDay: number; endDay: number }>;
}

export interface CropLifecycleState {
  crop: string;
  day: number | null;
  expectedDuration: number | null;
  stage: string;
  progress: number | null;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

const DEFAULT_RULES: CropLifecycleRule[] = [
  { crop: 'paddy', durationDays: 120, stages: [
    { name: 'Land preparation', startDay: 0, endDay: 10 },
    { name: 'Sowing / transplanting', startDay: 11, endDay: 20 },
    { name: 'Vegetative', startDay: 21, endDay: 55 },
    { name: 'Flowering', startDay: 56, endDay: 85 },
    { name: 'Grain filling', startDay: 86, endDay: 105 },
    { name: 'Harvest', startDay: 106, endDay: 120 },
  ]},
];

export function calculateCropLifecycle(
  crop: string | undefined,
  plantingDate: string | undefined,
  rules = DEFAULT_RULES,
): CropLifecycleState {
  if (!crop || !plantingDate) {
    return { crop: crop || 'Unknown crop', day: null, expectedDuration: null, stage: 'Unknown', progress: null, confidence: 'unknown' };
  }
  const rule = rules.find(r => r.crop.toLowerCase() === crop.toLowerCase());
  if (!rule) {
    return { crop, day: null, expectedDuration: null, stage: 'Crop duration not configured', progress: null, confidence: 'low' };
  }
  const start = new Date(plantingDate).getTime();
  const day = Math.max(0, Math.floor((Date.now() - start) / 86400000) + 1);
  const stage = rule.stages.find(s => day >= s.startDay && day <= s.endDay)?.name || (day > rule.durationDays ? 'Post-harvest' : 'Unknown');
  return {
    crop,
    day,
    expectedDuration: rule.durationDays,
    stage,
    progress: Math.min(100, Math.round((day / rule.durationDays) * 100)),
    confidence: 'high',
  };
}
