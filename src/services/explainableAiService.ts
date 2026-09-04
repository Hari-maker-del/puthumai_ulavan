export interface RecommendationEvidence {
  label: string;
  value: string;
}

export interface ExplainableRecommendation {
  recommendation: string;
  reasons: RecommendationEvidence[];
  confidence?: number;
  safetyNote?: string;
}

/**
 * Builds an explainable recommendation wrapper around AI output.
 * It never invents evidence; callers must provide the evidence actually
 * available in the application context.
 */
export function buildExplainableRecommendation(
  recommendation: string,
  reasons: RecommendationEvidence[],
  confidence?: number,
  safetyNote?: string,
): ExplainableRecommendation {
  return { recommendation, reasons, confidence, safetyNote };
}
