export const CROP_STAGES=['sowing','germination','vegetative','flowering','fruiting','harvest','post_harvest'] as const;
export type CropStage=typeof CROP_STAGES[number];
export function nextStage(stage:CropStage){const i=CROP_STAGES.indexOf(stage);return i>=0&&i<CROP_STAGES.length-1?CROP_STAGES[i+1]:null}

export const CROP_STAGE_LABELS: Record<string, string> = {
  'land-preparation': 'Land Preparation',
  'sowing': 'Sowing',
  'germination': 'Germination',
  'vegetative': 'Vegetative Growth',
  'flowering': 'Flowering',
  'fruiting': 'Fruiting',
  'harvest': 'Harvest',
  'post_harvest': 'Post-Harvest',
};

export interface LifecycleEvent {
  id: string;
  title: string;
  stage: string;
  status: 'completed' | 'current' | 'upcoming';
  note?: string;
}

export function buildCropTimeline(events: LifecycleEvent[]): LifecycleEvent[] {
  return events;
}
