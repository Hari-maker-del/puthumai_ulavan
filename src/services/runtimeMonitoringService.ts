export interface RuntimeEvent {
  type: 'error' | 'unhandledrejection' | 'performance';
  message: string;
  timestamp: string;
  path: string;
}

const KEY = 'puthumai-uzhavan:runtime-events';
let initialized = false;

function save(event: RuntimeEvent) {
  try {
    const current: RuntimeEvent[] = JSON.parse(localStorage.getItem(KEY) || '[]');
    current.push(event);
    localStorage.setItem(KEY, JSON.stringify(current.slice(-100)));
  } catch { /* intentional: storage errors must not crash */ }
  // Keep console output useful in Vercel/browser logs without leaking tokens.
  console.error('[Puthumai Uzhavan]', event.type, event.message);
}

export function initRuntimeMonitoring() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('error', event => {
    save({
      type: 'error',
      message: event.message || 'Unhandled browser error',
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
    });
  });

  window.addEventListener('unhandledrejection', event => {
    save({
      type: 'unhandledrejection',
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
    });
  });

  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const nav = entry as PerformanceNavigationTiming;
            save({
              type: 'performance',
              message: `navigation=${Math.round(nav.loadEventEnd - nav.startTime)}ms`,
              timestamp: new Date().toISOString(),
              path: window.location.pathname,
            });
          }
        }
      });
      observer.observe({ type: 'navigation', buffered: true });
    } catch { /* intentional: storage errors must not crash */ }
  }
}
