export interface AiEvidence {
  label: string;
  value: string;
  source?: string;
  status: 'live' | 'cached' | 'estimate' | 'demo' | 'user-provided';
}

export interface TrustedAiResult {
  answer: string;
  confidence: 'high' | 'medium' | 'low';
  evidence: AiEvidence[];
  disclaimer: string;
}

export function createTrustedAiResult(
  answer: string,
  evidence: AiEvidence[],
  confidence: TrustedAiResult['confidence'] = 'medium',
): TrustedAiResult {
  return {
    answer,
    confidence,
    evidence,
    disclaimer: 'AI guidance is decision support. Verify high-impact agricultural, financial, pesticide, and government-scheme decisions with authoritative sources or qualified experts.',
  };
}
