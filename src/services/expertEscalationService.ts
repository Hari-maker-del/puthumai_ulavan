export type EscalationReason =
  | 'low-confidence'
  | 'crop-disease'
  | 'safety-sensitive'
  | 'farmer-request';

export interface ExpertCase {
  reason: EscalationReason;
  summary: string;
  createdAt: string;
}

export function createExpertCase(reason: EscalationReason, summary: string): ExpertCase {
  return { reason, summary, createdAt: new Date().toISOString() };
}

export const DEFAULT_EXPERT_MESSAGE =
  'This result is not a substitute for professional agricultural advice. Please consult a qualified agricultural expert before applying pesticides, fertilizers, or other treatments.';
