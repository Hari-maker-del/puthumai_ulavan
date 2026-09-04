export type FarmerOutcome = 'followed' | 'not_followed' | 'later' | 'unknown';

export interface RecommendationOutcome {
  id: string;
  recommendationId: string;
  recommendation: string;
  context: Record<string, unknown>;
  outcome: FarmerOutcome;
  outcomeNote?: string;
  createdAt: string;
}

const KEY = 'puthumai-uzhavan:recommendation-outcomes';

export function recordRecommendationOutcome(
  recommendationId: string,
  recommendation: string,
  context: Record<string, unknown>,
  outcome: FarmerOutcome,
  outcomeNote?: string,
): RecommendationOutcome {
  const item: RecommendationOutcome = {
    id: crypto.randomUUID(),
    recommendationId,
    recommendation,
    context,
    outcome,
    outcomeNote,
    createdAt: new Date().toISOString(),
  };
  try {
    const current: RecommendationOutcome[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    current.push(item);
    localStorage.setItem(KEY, JSON.stringify(current.slice(-500)));
  } catch { /* intentional: storage errors must not crash */ }
  return item;
}

export function getRecommendationOutcomes(): RecommendationOutcome[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function summarizeOutcomes() {
  const items = getRecommendationOutcomes();
  return {
    total: items.length,
    followed: items.filter(x => x.outcome === 'followed').length,
    notFollowed: items.filter(x => x.outcome === 'not_followed').length,
    later: items.filter(x => x.outcome === 'later').length,
  };
}
