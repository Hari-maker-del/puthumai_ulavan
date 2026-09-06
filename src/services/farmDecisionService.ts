import type { CopilotContext } from '@/services/aiCopilotService';

export interface FarmAction {
  id: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  source: 'weather' | 'crop' | 'market' | 'finance' | 'profile';
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildFarmActions(context: CopilotContext): FarmAction[] {
  const actions: FarmAction[] = [];
  const weather = context.weather?.today;
  const memory = context.farmerMemory;
  const memoryStage = clean(memory?.crop_stage).toLowerCase();
  const memoryCrop = clean(memory?.current_crop);

  if (weather) {
    const rain = numberValue(weather.rainProbability);
    const temperature = numberValue(weather.temp);

    if (rain !== null && rain >= 70) {
      actions.push({
        id: 'rain',
        title: 'Prepare for rain',
        detail: `${rain}% rain probability is available for today. Check drainage and avoid unnecessary irrigation.`,
        priority: 'high',
        source: 'weather',
      });
    } else if (rain !== null && rain >= 40) {
      actions.push({
        id: 'rain-watch',
        title: 'Watch rainfall before irrigation',
        detail: `${rain}% rain probability is available. Check soil moisture before watering.`,
        priority: 'medium',
        source: 'weather',
      });
    }

    if (temperature !== null && temperature >= 35) {
      actions.push({
        id: 'heat',
        title: 'Check heat stress',
        detail: `${temperature}°C is hot. Inspect leaves and soil moisture during the cooler part of the day.`,
        priority: 'high',
        source: 'weather',
      });
    }
  }

  // Prefer the farmer's recorded crop memory, but also use every available
  // crop record so the intelligence layer is not limited to one crop/field.
  const cropRecords = context.crops
    .map((row) => ({
      crop: clean(row.name ?? row.crop),
      field: clean(row.field ?? row.field_name),
      stage: clean(row.stage).toLowerCase(),
      health: numberValue(row.health),
    }))
    .filter((row) => row.crop);

  const seenCrops = new Set<string>();
  const actionableCrops = [
    ...(memoryCrop ? [{ crop: memoryCrop, field: '', stage: memoryStage, health: numberValue(memory?.health) }] : []),
    ...cropRecords,
  ];

  for (const record of actionableCrops) {
    const key = `${record.crop.toLowerCase()}|${record.field.toLowerCase()}`;
    if (seenCrops.has(key)) continue;
    seenCrops.add(key);

    const location = record.field ? ` in ${record.field}` : '';
    if (record.health !== null && record.health < 60) {
      actions.push({
        id: `crop-risk-${key}`,
        title: `Inspect ${record.crop}${location}`,
        detail: `The recorded crop health is ${record.health}%. Verify the field condition and record observations before treatment.`,
        priority: 'high',
        source: 'crop',
      });
    } else if (record.stage.includes('flower')) {
      actions.push({
        id: `flowering-${key}`,
        title: `Inspect ${record.crop} at flowering`,
        detail: `Check ${record.crop}${location} for moisture stress, visible pest symptoms and other changes during flowering.`,
        priority: 'high',
        source: 'crop',
      });
    } else if (record.stage.includes('harvest')) {
      actions.push({
        id: `harvest-${key}`,
        title: `Prepare ${record.crop} harvest`,
        detail: `Review expected harvest timing, storage/transport needs and the latest verified market records for ${record.crop}.`,
        priority: 'high',
        source: 'crop',
      });
    } else {
      actions.push({
        id: `crop-check-${key}`,
        title: `Inspect ${record.crop}${location}`,
        detail: `Check leaves, soil moisture and visible stress. Record anything unusual in Crop Health.`,
        priority: 'medium',
        source: 'crop',
      });
    }
  }

  if (!actionableCrops.length) {
    actions.push({
      id: 'profile',
      title: 'Complete your crop profile',
      detail: 'Add your current crops, fields and crop stages so the co-pilot can personalize decisions.',
      priority: 'high',
      source: 'profile',
    });
  }

  if (context.marketAvailable) {
    const latest = context.market.find((row) => numberValue(row.price) !== null);
    const price = latest ? numberValue(latest.price) : null;
    const marketCrop = clean(latest?.crop) || memoryCrop;
    if (latest && price !== null && marketCrop) {
      actions.push({
        id: 'market',
        title: `Review verified ${marketCrop} market price`,
        detail: `${marketCrop} has a verified record at ₹${price.toLocaleString('en-IN')} ${clean(latest.unit) || '/quintal'}. Use the simulator before deciding to sell.`,
        priority: 'medium',
        source: 'market',
      });
    }
  }

  if (context.expenses.length >= 3) {
    const recentTotal = context.expenses
      .slice(0, 5)
      .reduce((sum, row) => sum + Math.max(0, Number(row.amount ?? 0)), 0);
    if (recentTotal > 0) {
      actions.push({
        id: 'finance',
        title: 'Review recent farm spending',
        detail: `Your latest recorded expenses total ₹${recentTotal.toLocaleString('en-IN')}. Check whether the biggest input costs are still planned.`,
        priority: 'low',
        source: 'finance',
      });
    }
  }

  const priorityRank = { high: 0, medium: 1, low: 2 };
  return actions
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 6);
}
