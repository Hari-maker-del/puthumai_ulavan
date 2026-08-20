import { getRecommendationOutcomes } from './farmOutcomeLearningService';

export function getOutcomeAnalytics() {
  const outcomes = getRecommendationOutcomes();
  const total = outcomes.length;
  const followed = outcomes.filter(o => o.outcome === 'followed').length;
  const notFollowed = outcomes.filter(o => o.outcome === 'not_followed').length;
  const later = outcomes.filter(o => o.outcome === 'later').length;
  return {
    total,
    followed,
    notFollowed,
    later,
    followRate: total ? Math.round((followed / total) * 100) : 0,
  };
}
