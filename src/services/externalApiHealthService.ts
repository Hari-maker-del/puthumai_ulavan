export type ExternalApiStatus = 'LIVE' | 'AUTH_ERROR' | 'RATE_LIMITED' | 'TIMEOUT' | 'OFFLINE' | 'UNAVAILABLE';

export function classifyHttpFailure(status: number): ExternalApiStatus {
  if (status === 401 || status === 403) return 'AUTH_ERROR';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'UNAVAILABLE';
  return 'UNAVAILABLE';
}

export function classifyNetworkFailure(error: unknown): ExternalApiStatus {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  if (message.includes('timeout')) return 'TIMEOUT';
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'OFFLINE';
  return 'UNAVAILABLE';
}
