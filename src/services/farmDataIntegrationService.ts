/**
 * Central farm data contract.
 * Adapters can be connected to live providers without changing UI modules.
 * Data is explicitly labelled live/cached/estimate/demo.
 */
export type DataStatus = 'live' | 'cached' | 'estimate' | 'demo' | 'unavailable';

export interface DataEnvelope<T> {
  data: T | null;
  status: DataStatus;
  source?: string;
  updatedAt?: string;
  error?: string;
}

export interface FarmContextSnapshot {
  farmer: DataEnvelope<Record<string, unknown>>;
  farm: DataEnvelope<Record<string, unknown>>;
  crop: DataEnvelope<Record<string, unknown>>;
  weather: DataEnvelope<Record<string, unknown>>;
  market: DataEnvelope<Record<string, unknown>>;
  finance: DataEnvelope<Record<string, unknown>>;
  alerts: DataEnvelope<Record<string, unknown>[]>;
}

export function makeEnvelope<T>(
  data: T | null,
  status: DataStatus,
  source?: string,
  error?: string,
): DataEnvelope<T> {
  return {
    data,
    status,
    source,
    error,
    updatedAt: data ? new Date().toISOString() : undefined,
  };
}
