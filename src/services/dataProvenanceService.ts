export type DataProvenance = 'LIVE' | 'CACHED' | 'ESTIMATE' | 'DEMO' | 'UNAVAILABLE';

export interface Provenanced<T> {
  value: T;
  provenance: DataProvenance;
  source?: string;
  observedAt?: string;
  expiresAt?: string;
  confidence?: number;
}

export function isTrustedLive<T>(item: Provenanced<T>): boolean {
  return item.provenance === 'LIVE' && (!item.expiresAt || Date.parse(item.expiresAt) > Date.now());
}

export function provenanceLabel(p: DataProvenance): string {
  return p === 'LIVE' ? 'Live' :
    p === 'CACHED' ? 'Cached' :
    p === 'ESTIMATE' ? 'Estimated' :
    p === 'DEMO' ? 'Demo' : 'Unavailable';
}
