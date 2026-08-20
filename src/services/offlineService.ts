const CACHE_PREFIX = 'puthumai-uzhavan:offline:';

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && !navigator.onLine;
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

export function queueOfflineAction(action: unknown): void {
  try {
    const key = `${CACHE_PREFIX}queued-actions`;
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    existing.push({ action, queuedAt: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(existing));
  } catch {
    // Never white-screen because offline storage failed.
  }
}

export function getQueuedActions(): unknown[] {
  try {
    return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}queued-actions`) || '[]');
  } catch {
    return [];
  }
}
