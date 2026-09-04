const CACHE_PREFIX = 'puthumai-uzhavan:offline:';
const API_CACHE_PREFIX = `${CACHE_PREFIX}api:`;
const REQUEST_QUEUE_KEY = `${CACHE_PREFIX}request-queue`;
const LEGACY_QUEUE_KEY = `${CACHE_PREFIX}queued-actions`;
const MAX_CACHE_ENTRY_BYTES = 900_000;

export interface OfflineQueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  queuedAt: string;
  attempts: number;
}

interface CachedResponse {
  body: string;
  headers: Record<string, string>;
  savedAt: string;
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  try { return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}

function requestCacheKey(url: string): string {
  return `${API_CACHE_PREFIX}${url}`;
}

export function saveOffline<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({
      value,
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // Storage may be unavailable/private mode. Never crash the app.
  }
}

export function loadOffline<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;
    return JSON.parse(raw).value as T;
  } catch {
    return null;
  }
}

export function cacheApiResponse(url: string, body: string, headers: Headers): void {
  if (!body || body.length > MAX_CACHE_ENTRY_BYTES) return;
  try {
    const normalizedHeaders: Record<string, string> = {};
    headers.forEach((value, key) => { normalizedHeaders[key] = value; });
    const cached: CachedResponse = {
      body,
      headers: normalizedHeaders,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(requestCacheKey(url), JSON.stringify(cached));
  } catch {
    // Cache is best-effort only.
  }
}

export function loadCachedApiResponse(url: string): CachedResponse | null {
  try {
    return safeJsonParse<CachedResponse | null>(localStorage.getItem(requestCacheKey(url)), null);
  } catch {
    return null;
  }
}

export function queueOfflineRequest(request: Omit<OfflineQueuedRequest, 'id' | 'queuedAt' | 'attempts'>): OfflineQueuedRequest {
  const queue = getQueuedRequests();
  const duplicate = queue.find((item) => item.method === request.method && item.url === request.url && item.body === request.body);
  if (duplicate) return duplicate;

  const item: OfflineQueuedRequest = {
    ...request,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    queuedAt: new Date().toISOString(),
    attempts: 0,
  };
  queue.push(item);
  try { localStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(queue)); } catch { /* best effort */ }
  return item;
}

export function getQueuedRequests(): OfflineQueuedRequest[] {
  try { return safeJsonParse<OfflineQueuedRequest[]>(localStorage.getItem(REQUEST_QUEUE_KEY), []); } catch { return []; }
}

export function removeQueuedRequest(id: string): void {
  try { localStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(getQueuedRequests().filter((item) => item.id !== id))); } catch { /* best effort */ }
}

export function markQueuedRequestAttempt(id: string): void {
  try {
    localStorage.setItem(REQUEST_QUEUE_KEY, JSON.stringify(getQueuedRequests().map((item) => item.id === id ? { ...item, attempts: item.attempts + 1 } : item)));
  } catch { /* best effort */ }
}

export function queueOfflineAction(action: unknown): void {
  try {
    const existing = safeJsonParse<Array<{ action: unknown; queuedAt: string }>>(localStorage.getItem(LEGACY_QUEUE_KEY), []);
    existing.push({ action, queuedAt: new Date().toISOString() });
    localStorage.setItem(LEGACY_QUEUE_KEY, JSON.stringify(existing));
  } catch {
    // Never white-screen because offline storage failed.
  }
}

export function getQueuedActions(): unknown[] {
  try { return safeJsonParse<unknown[]>(localStorage.getItem(LEGACY_QUEUE_KEY), []); } catch { return []; }
}

export function getTotalQueuedActions(): number {
  return getQueuedRequests().length + getQueuedActions().length;
}

export function clearOfflineUserData(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX) || key === 'puthumai-uzhavan:sync-queue' || key === 'puthumai-ulavan:offline-operations') {
        keys.push(key);
      }
    }
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage may be unavailable/private mode. Never crash during logout.
  }
}

export function subscribeOfflineState(listener: (offline: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onOnline = () => listener(false);
  const onOffline = () => listener(true);
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}
