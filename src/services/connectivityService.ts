export type ConnectivityStatus = 'online' | 'offline';

export function getConnectivityStatus(): ConnectivityStatus {
  return typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';
}

export function subscribeConnectivity(listener: (status: ConnectivityStatus) => void): () => void {
  if (typeof window === 'undefined') return () => undefined;

  const online = () => listener('online');
  const offline = () => listener('offline');

  window.addEventListener('online', online);
  window.addEventListener('offline', offline);

  return () => {
    window.removeEventListener('online', online);
    window.removeEventListener('offline', offline);
  };
}
