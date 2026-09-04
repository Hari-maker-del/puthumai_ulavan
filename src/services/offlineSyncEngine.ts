export interface QueuedSyncAction {
  id: string;
  type: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
}

const KEY = 'puthumai-uzhavan:sync-queue';

export function queueSyncAction(type: string, payload: unknown): void {
  try {
    const current: QueuedSyncAction[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    current.push({ id: crypto.randomUUID(), type, payload, createdAt: new Date().toISOString(), attempts: 0 });
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch { /* intentional: storage errors must not crash */ }
}

export function readSyncQueue(): QueuedSyncAction[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function clearSyncQueue(): void {
  try { localStorage.removeItem(KEY); } catch { /* intentional: storage errors must not crash */ }
}
