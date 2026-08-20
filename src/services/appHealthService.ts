export interface HealthCheck {
  name: string;
  status: 'ok' | 'degraded' | 'unavailable';
  message: string;
}

export async function runClientHealthChecks(): Promise<HealthCheck[]> {
  const checks: HealthCheck[] = [
    {
      name: 'Browser storage',
      status: (() => { try { localStorage.setItem('__pu_health__', '1'); localStorage.removeItem('__pu_health__'); return 'ok'; } catch { return 'degraded'; } })(),
      message: 'Local storage is used for cached/offline information.',
    },
    {
      name: 'Network',
      status: typeof navigator !== 'undefined' && navigator.onLine ? 'ok' : 'degraded',
      message: typeof navigator !== 'undefined' && navigator.onLine ? 'Network is available.' : 'Device is offline.',
    },
    {
      name: 'Speech recognition',
      status: typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? 'ok' : 'unavailable',
      message: 'Voice input depends on browser support.',
    },
  ];
  return checks;
}
