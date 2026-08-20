import { getConnectivityStatus, subscribeConnectivity } from '@/services/connectivityService';
import {
  getOfflineOperations,
  markOfflineAttempt,
  removeOfflineOperation,
  type OfflineOperation,
} from '@/services/offlineOperationService';

export type SyncState = 'IDLE' | 'OFFLINE' | 'SYNCING' | 'SYNCED' | 'ERROR';

export interface SyncAdapter {
  execute(_operation: OfflineOperation): Promise<void>;
}

let running = false;

export async function syncOfflineOperations(adapter: SyncAdapter): Promise<SyncState> {
  if (getConnectivityStatus() === 'offline') return 'OFFLINE';
  if (running) return 'SYNCING';

  running = true;
  try {
    const operations = getOfflineOperations();

    for (const operation of operations) {
      try {
        await adapter.execute(operation);
        removeOfflineOperation(operation.id);
      } catch {
        markOfflineAttempt(operation.id);
        return 'ERROR';
      }
    }

    return 'SYNCED';
  } finally {
    running = false;
  }
}

export function startSyncCoordinator(adapter: SyncAdapter, onState?: (_state: SyncState) => void) {
  const publish = (_state: SyncState) => onState?.(state);

  const run = async () => {
    const state = await syncOfflineOperations(adapter);
    publish(state);
  };

  publish(getConnectivityStatus() === 'online' ? 'IDLE' : 'OFFLINE');
  const unsubscribe = subscribeConnectivity(status => {
    if (status === 'online') void run();
    else publish('OFFLINE');
  });

  if (getConnectivityStatus() === 'online') void run();

  return unsubscribe;
}
