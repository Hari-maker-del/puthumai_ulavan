export type DataProvenance =
  | 'LIVE'
  | 'CACHED'
  | 'ESTIMATE'
  | 'DEMO'
  | 'USER_ENTERED'
  | 'AI_GENERATED';

export interface Provenance {
  source: DataProvenance;
  observedAt: string;
  expiresAt?: string;
  sourceName?: string;
}

export function isFresh(p: Provenance, now = Date.now()): boolean {
  return !p.expiresAt || Date.parse(p.expiresAt) > now;
}
