export interface CropLifecycleStageRule {
  key: string;
  name: string;
  startDay?: number;
  endDay?: number;
}

export interface CropLifecycleRule {
  crop: string;
  durationDays: number | null;
  stages: CropLifecycleStageRule[];
  aliases?: string[];
  family?: CropLifecycleFamily;
}

export type CropLifecycleFamily =
  | 'cereal'
  | 'pulse'
  | 'oilseed'
  | 'root_tuber'
  | 'leafy'
  | 'fruiting_vegetable'
  | 'legume'
  | 'fruit'
  | 'plantation'
  | 'fiber'
  | 'sugar'
  | 'spice'
  | 'fodder'
  | 'generic';

export interface CropLifecycleState {
  crop: string;
  day: number | null;
  expectedDuration: number | null;
  stage: string;
  progress: number | null;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
}

const FAMILY_STAGES: Record<CropLifecycleFamily, CropLifecycleStageRule[]> = {
  cereal: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'tillering', name: 'Tillering / Stem Development' },
    { key: 'flowering', name: 'Flowering / Pollination' },
    { key: 'grain_filling', name: 'Grain Filling' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  pulse: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'pod_setting', name: 'Pod Setting' },
    { key: 'seed_filling', name: 'Seed Filling' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  oilseed: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'pod_or_head_development', name: 'Pod / Head Development' },
    { key: 'seed_oil_filling', name: 'Seed / Oil Filling' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  root_tuber: [
    { key: 'planting', name: 'Planting' },
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'storage_root_development', name: 'Root / Tuber Development' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  leafy: [
    { key: 'planting', name: 'Planting / Establishment' },
    { key: 'vegetative', name: 'Leaf Development' },
    { key: 'head_or_rosette', name: 'Head / Rosette Formation' },
    { key: 'maturity', name: 'Market Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  fruiting_vegetable: [
    { key: 'nursery_or_establishment', name: 'Nursery / Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'fruit_set', name: 'Fruit Set' },
    { key: 'fruit_development', name: 'Fruit Development' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  legume: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'pod_development', name: 'Pod Development' },
    { key: 'seed_filling', name: 'Seed Filling' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  fruit: [
    { key: 'planting_or_establishment', name: 'Planting / Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'fruit_set', name: 'Fruit Set' },
    { key: 'fruit_development', name: 'Fruit Development' },
    { key: 'ripening', name: 'Ripening' },
    { key: 'harvest', name: 'Harvest' },
  ],
  plantation: [
    { key: 'planting', name: 'Planting / Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'fruit_or_bunch_development', name: 'Fruit / Bunch Development' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  fiber: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'flowering', name: 'Flowering' },
    { key: 'boll_or_fiber_development', name: 'Boll / Fiber Development' },
    { key: 'opening_or_maturity', name: 'Opening / Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  sugar: [
    { key: 'planting', name: 'Planting / Establishment' },
    { key: 'germination', name: 'Germination' },
    { key: 'tillering', name: 'Tillering' },
    { key: 'grand_growth', name: 'Grand Growth' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  spice: [
    { key: 'planting', name: 'Planting / Establishment' },
    { key: 'sprouting', name: 'Sprouting' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'reproductive_or_storage', name: 'Reproductive / Storage Organ Development' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
  fodder: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'maturity', name: 'Harvest Maturity' },
    { key: 'harvest', name: 'Harvest / Cutting' },
  ],
  generic: [
    { key: 'establishment', name: 'Establishment' },
    { key: 'vegetative', name: 'Vegetative Growth' },
    { key: 'reproductive', name: 'Reproductive Development' },
    { key: 'maturity', name: 'Maturity' },
    { key: 'harvest', name: 'Harvest' },
  ],
};

const CROP_ALIASES: Array<{ family: CropLifecycleFamily; names: string[] }> = [
  { family: 'cereal', names: ['rice', 'paddy', 'wheat', 'maize', 'corn', 'barley', 'oat', 'oats', 'rye', 'triticale', 'sorghum', 'millet', 'pearl millet', 'finger millet', 'foxtail millet', 'teff'] },
  { family: 'pulse', names: ['chickpea', 'gram', 'kabuli', 'lentil', 'pigeon pea', 'tur dal', 'red gram', 'black gram', 'urad', 'mung bean', 'green gram', 'cowpea', 'field pea', 'dry bean', 'kidney bean'] },
  { family: 'oilseed', names: ['soybean', 'soy', 'groundnut', 'peanut', 'sunflower', 'canola', 'rapeseed', 'mustard', 'sesame', 'safflower', 'linseed', 'flaxseed', 'castor', 'niger'] },
  { family: 'root_tuber', names: ['potato', 'sweet potato', 'cassava', 'manioc', 'yam', 'taro', 'colocasia', 'carrot', 'radish', 'beetroot', 'beet', 'turnip', 'parsnip'] },
  { family: 'leafy', names: ['spinach', 'lettuce', 'cabbage', 'kale', 'amaranth', 'mustard greens', 'bok choy', 'pak choi', 'cauliflower', 'broccoli', 'celery'] },
  { family: 'fruiting_vegetable', names: ['tomato', 'tomatoes', 'chilli', 'chili', 'pepper', 'capsicum', 'eggplant', 'brinjal', 'okra', 'lady finger', 'cucumber', 'squash', 'zucchini', 'pumpkin', 'melon', 'watermelon'] },
  { family: 'legume', names: ['green bean', 'snap bean', 'french bean', 'pea', 'peas', 'fresh bean', 'broad bean', 'faba bean'] },
  { family: 'fruit', names: ['mango', 'banana', 'apple', 'orange', 'mandarin', 'lemon', 'lime', 'grape', 'grapes', 'pomegranate', 'guava', 'papaya', 'pineapple', 'avocado', 'coconut', 'peach', 'plum', 'apricot', 'pear', 'kiwi', 'strawberry'] },
  { family: 'plantation', names: ['banana', 'coconut', 'coffee', 'tea', 'cacao', 'cocoa', 'rubber', 'oil palm', 'date palm'] },
  { family: 'fiber', names: ['cotton', 'flax', 'hemp', 'jute', 'kenaf', 'sisal'] },
  { family: 'sugar', names: ['sugarcane', 'sugar cane', 'sugar beet'] },
  { family: 'spice', names: ['turmeric', 'ginger', 'garlic', 'onion', 'shallot', 'black pepper', 'cardamom', 'clove', 'cinnamon', 'coriander', 'cumin', 'fennel', 'fenugreek', 'nutmeg'] },
  { family: 'fodder', names: ['alfalfa', 'lucerne', 'napier grass', 'sorghum fodder', 'maize fodder', 'clover'] },
];

const GLOBAL_RULE_OVERRIDES: CropLifecycleRule[] = [
  {
    crop: 'paddy',
    aliases: ['rice'],
    family: 'cereal',
    durationDays: 120,
    stages: [
      { key: 'land_preparation', name: 'Land Preparation', startDay: 0, endDay: 10 },
      { key: 'sowing', name: 'Sowing / Transplanting', startDay: 11, endDay: 20 },
      { key: 'vegetative', name: 'Vegetative Growth', startDay: 21, endDay: 55 },
      { key: 'flowering', name: 'Flowering', startDay: 56, endDay: 85 },
      { key: 'grain_filling', name: 'Grain Filling', startDay: 86, endDay: 105 },
      { key: 'maturity', name: 'Maturity', startDay: 106, endDay: 112 },
      { key: 'harvest', name: 'Harvest', startDay: 113, endDay: 120 },
    ],
  },
];

const customRules = new Map<string, CropLifecycleRule>();

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ');
}

function findAliasFamily(crop?: string): CropLifecycleFamily {
  const value = normalizeName(crop ?? '');
  if (!value) return 'generic';

  for (const group of CROP_ALIASES) {
    if (group.names.some((name) => value === name || value.includes(name) || name.includes(value))) {
      return group.family;
    }
  }

  return 'generic';
}

function createFamilyRule(crop: string, family: CropLifecycleFamily): CropLifecycleRule {
  return {
    crop,
    family,
    durationDays: null,
    stages: FAMILY_STAGES[family].map((stage) => ({ ...stage })),
  };
}

export function registerCropLifecycleRule(rule: CropLifecycleRule) {
  const key = normalizeName(rule.crop);
  if (!key) throw new Error('Crop lifecycle rule requires a crop name.');
  customRules.set(key, {
    ...rule,
    crop: rule.crop.trim(),
    stages: rule.stages.map((stage) => ({ ...stage })),
    aliases: rule.aliases ? [...rule.aliases] : undefined,
  });
}

export function registerCropLifecycleRules(rules: CropLifecycleRule[]) {
  rules.forEach(registerCropLifecycleRule);
}

export function getCropLifecycleFamily(crop?: string): CropLifecycleFamily {
  const rule = getCropLifecycleRule(crop);
  return rule?.family ?? findAliasFamily(crop);
}

export function getCropLifecycleRule(crop?: string): CropLifecycleRule | null {
  if (!crop) return null;
  const key = normalizeName(crop);
  const custom = customRules.get(key);
  if (custom) return custom;

  const override = GLOBAL_RULE_OVERRIDES.find((rule) =>
    normalizeName(rule.crop) === key || (rule.aliases ?? []).some((alias) => normalizeName(alias) === key),
  );
  if (override) return override;

  const family = findAliasFamily(crop);
  return createFamilyRule(crop.trim(), family);
}

export function getCropLifecycleStages(crop?: string): CropLifecycleStageRule[] {
  return getCropLifecycleRule(crop)?.stages ?? FAMILY_STAGES.generic.map((stage) => ({ ...stage }));
}

export function calculateCropLifecycle(
  crop: string | undefined,
  plantingDate: string | undefined,
  rules?: CropLifecycleRule[],
): CropLifecycleState {
  if (!crop) {
    return {
      crop: 'Unknown crop',
      day: null,
      expectedDuration: null,
      stage: 'Unknown',
      progress: null,
      confidence: 'unknown',
    };
  }

  const key = normalizeName(crop);
  const registeredRule = rules?.find((item) =>
    normalizeName(item.crop) === key || (item.aliases ?? []).some((alias) => normalizeName(alias) === key),
  );
  const rule = registeredRule ?? getCropLifecycleRule(crop);

  if (!plantingDate) {
    return {
      crop,
      day: null,
      expectedDuration: rule?.durationDays ?? null,
      stage: 'Not started',
      progress: null,
      confidence: rule ? 'medium' : 'unknown',
    };
  }

  const start = new Date(plantingDate).getTime();
  if (!Number.isFinite(start)) {
    return {
      crop,
      day: null,
      expectedDuration: rule?.durationDays ?? null,
      stage: 'Invalid planting date',
      progress: null,
      confidence: 'low',
    };
  }

  const day = Math.max(0, Math.floor((Date.now() - start) / 86400000) + 1);

  if (!rule) {
    return {
      crop,
      day,
      expectedDuration: null,
      stage: 'Lifecycle stages not configured',
      progress: null,
      confidence: 'low',
    };
  }

  if (rule.durationDays == null) {
    return {
      crop,
      day,
      expectedDuration: null,
      stage: 'Duration not configured',
      progress: null,
      confidence: rule.family === 'generic' ? 'low' : 'medium',
    };
  }

  const stage =
    rule.stages.find((item) => item.startDay != null && item.endDay != null && day >= item.startDay && day <= item.endDay)?.name ||
    (day > rule.durationDays ? 'Post-harvest' : 'Unknown');

  return {
    crop,
    day,
    expectedDuration: rule.durationDays,
    stage,
    progress: Math.min(100, Math.round((day / rule.durationDays) * 100)),
    confidence: 'high',
  };
}
