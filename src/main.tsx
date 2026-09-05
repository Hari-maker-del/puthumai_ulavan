import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './index.css';

// Restore the user's appearance preference before the first render.
if (typeof window !== 'undefined') {
  try {
    const darkMode = window.localStorage.getItem('puthumai_uzhavan_dark_mode') === 'true';
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.style.colorScheme = darkMode ? 'dark' : 'light';
  } catch {
    // First render remains in light mode if browser storage is unavailable.
  }
}
import { initRuntimeMonitoring } from './services/runtimeMonitoringService';
import { startOfflineSyncCoordinator } from './services/offlineSyncCoordinator';

initRuntimeMonitoring();
startOfflineSyncCoordinator();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element "#root" was not found.');
}

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => undefined);
  });
}

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
