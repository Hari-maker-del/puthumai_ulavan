import { getQueuedRequests, markQueuedRequestAttempt, removeQueuedRequest, type OfflineQueuedRequest } from '@/services/offlineService';
import { supabase } from '@/lib/supabase';

let flushing = false;

async function currentAccessToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

async function replay(item: OfflineQueuedRequest): Promise<boolean> {
  const headers = new Headers(item.headers);
  const token = await currentAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  try {
    const response = await fetch(item.url, {
      method: item.method,
      headers,
      body: item.method === 'DELETE' ? undefined : item.body,
    });
    return response.ok || response.status === 409;
  } catch {
    return false;
  }
}

export async function flushOfflineQueue(): Promise<number> {
  if (flushing || typeof navigator === 'undefined' || !navigator.onLine) return 0;
  flushing = true;
  let synced = 0;
  try {
    for (const item of getQueuedRequests()) {
      const ok = await replay(item);
      if (ok) {
        removeQueuedRequest(item.id);
        synced += 1;
      } else {
        markQueuedRequestAttempt(item.id);
        // Stop on the first failure so requests preserve their original order.
        break;
      }
    }
  } finally {
    flushing = false;
  }
  if (synced > 0) window.dispatchEvent(new CustomEvent('puthumai-offline-synced', { detail: { count: synced } }));
  return synced;
}

export function startOfflineSyncCoordinator(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const onOnline = () => { void flushOfflineQueue(); };
  window.addEventListener('online', onOnline);
  // Flush once after the app starts in case connectivity returned while it was closed.
  if (navigator.onLine) void flushOfflineQueue();
  return () => window.removeEventListener('online', onOnline);
}
