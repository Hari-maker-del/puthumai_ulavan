import type { CopilotContext } from '@/services/aiCopilotService';

export interface FarmAction {
  id: string;
  title: string;
  detail: string;
  priority: 'high' | 'medium' | 'low';
  source: 'weather' | 'crop' | 'market' | 'finance' | 'profile';
}

export function buildFarmActions(context: CopilotContext): FarmAction[] {
  const actions: FarmAction[] = [];
  const weather = context.weather?.today;
  const memory = context.farmerMemory;
  const stage = (memory?.crop_stage ?? '').toLowerCase();
  const crop = memory?.current_crop ?? 'your crop';

  if (weather) {
    if ((weather.rainProbability ?? 0) >= 70) {
      actions.push({
        id: 'rain',
        title: 'Prepare for rain',
        detail: `${weather.rainProbability}% rain probability is available for today. Check drainage and avoid unnecessary irrigation.`,
        priority: 'high', source: 'weather',
      });
    } else if ((weather.rainProbability ?? 0) >= 40) {
      actions.push({
        id: 'rain-watch',
        title: 'Watch rainfall before irrigation',
        detail: `${weather.rainProbability}% rain probability is available. Check soil moisture before watering.`,
        priority: 'medium', source: 'weather',
      });
    }

    if (weather.temp >= 35) {
      actions.push({
        id: 'heat',
        title: 'Check heat stress',
        detail: `${weather.temp}°C is hot. Inspect leaves and soil moisture during the cooler part of the day.`,
        priority: 'high', source: 'weather',
      });
    }
  }

  if (memory?.current_crop) {
    if (stage.includes('flower')) {
      actions.push({
        id: 'flowering',
        title: `Inspect ${crop} at flowering`,
        detail: 'Check crop health, moisture and visible pest or disease symptoms closely during flowering.',
        priority: 'high', source: 'crop',
      });
    } else if (stage.includes('harvest')) {
      actions.push({
        id: 'harvest',
        title: `Prepare ${crop} harvest`,
        detail: 'Review expected harvest timing, storage/transport needs and the latest verified market records.',
        priority: 'high', source: 'crop',
      });
    } else {
      actions.push({
        id: 'crop-check',
        title: `Inspect ${crop}`,
        detail: `Check leaves, soil moisture and visible stress today. Record anything unusual in Crop Health.`,
        priority: 'medium', source: 'crop',
      });
    }
  } else {
    actions.push({
      id: 'profile',
      title: 'Complete your farm profile',
      detail: 'Add your current crop, crop stage and soil information so the co-pilot can personalize recommendations.',
      priority: 'high', source: 'profile',
    });
  }

  if (context.marketAvailable) {
    const latest = context.market[0] as Record<string, unknown> | undefined;
    if (latest) {
      actions.push({
        id: 'market',
        title: 'Review verified market price',
        detail: `${String(latest.crop ?? crop)} has a verified record at ₹${Number(latest.price ?? 0).toLocaleString('en-IN')} ${String(latest.unit ?? '/quintal')}. Use the simulator before deciding to sell.`,
        priority: 'medium', source: 'market',
      });
    }
  }

  if (context.expenses.length >= 3) {
    const recentTotal = context.expenses.slice(0, 5).reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
    if (recentTotal > 0) {
      actions.push({
        id: 'finance',
        title: 'Review recent farm spending',
        detail: `Your latest recorded expenses total ₹${recentTotal.toLocaleString('en-IN')}. Check whether the biggest input costs are still planned.`,
        priority: 'low', source: 'finance',
      });
    }
  }

  return actions.slice(0, 5);
}
