import type { DataProvenance, Provenanced } from './dataProvenanceService';

export interface FarmDecisionContext {
  crop?: string;
  cropStage?: string;
  plantingDate?: string;
  weather?: Provenanced<unknown>;
  market?: Provenanced<unknown>;
  soil?: Provenanced<unknown>;
  expenses?: Provenanced<unknown>;
  recentOutcomes?: unknown[];
}

export interface ExplainableDecision {
  recommendation: string;
  reasons: string[];
  evidence: Array<{ label: string; provenance: DataProvenance; source?: string }>;
  confidence: number;
  risk: 'low' | 'medium' | 'high';
  verificationRequired: boolean;
  generatedAt: string;
}

export function buildDecisionEnvelope(
  recommendation: string,
  reasons: string[],
  evidence: ExplainableDecision['evidence'],
  confidence = 0.5,
  risk: ExplainableDecision['risk'] = 'medium',
): ExplainableDecision {
  const verificationRequired = risk === 'high' || evidence.some(e => e.provenance === 'DEMO' || e.provenance === 'UNAVAILABLE');
  return {
    recommendation,
    reasons,
    evidence,
    confidence: Math.max(0, Math.min(1, confidence)),
    risk,
    verificationRequired,
    generatedAt: new Date().toISOString(),
  };
}
