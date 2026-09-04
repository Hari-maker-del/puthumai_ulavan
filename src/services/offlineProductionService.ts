import { getTotalQueuedActions, isOffline, subscribeOfflineState } from '@/services/offlineService';

export type ConnectionState = 'online' | 'offline' | 'syncing' | 'synced';

export function connectionState(): ConnectionState {
  return isOffline() ? 'offline' : getTotalQueuedActions() > 0 ? 'online' : 'online';
}

export function watchConnection(cb: (s: ConnectionState) => void) {
  let stopped = false;
  const emit = (offline: boolean) => { if (!stopped) cb(offline ? 'offline' : 'online'); };
  const unsubscribe = subscribeOfflineState((offline) => emit(offline));
  const onSync = () => cb(isOffline() ? 'offline' : 'synced');
  window.addEventListener('puthumai-offline-synced', onSync);
  return () => {
    stopped = true;
    unsubscribe();
    window.removeEventListener('puthumai-offline-synced', onSync);
  };
}
