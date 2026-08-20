export type CropStage =
  | 'land-preparation'
  | 'sowing'
  | 'germination'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'harvest'
  | 'post-harvest';

export interface LifecycleEvent {
  id: string;
  title: string;
  stage: CropStage;
  date?: string;
  status: 'completed' | 'current' | 'upcoming';
  note?: string;
}

export function buildCropTimeline(events: LifecycleEvent[]): LifecycleEvent[] {
  return [...events].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

export const CROP_STAGE_LABELS: Record<CropStage, string> = {
  'land-preparation': 'Land preparation',
  sowing: 'Sowing',
  germination: 'Germination',
  vegetative: 'Vegetative',
  flowering: 'Flowering',
  fruiting: 'Fruiting / grain filling',
  harvest: 'Harvest',
  'post-harvest': 'Post-harvest',
};
