import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { cacheApiResponse, isOffline, loadCachedApiResponse } from '@/services/offlineService';

const configuredApiUrl = String(import.meta.env.VITE_API_URL ?? '').trim();
export const API_URL = configuredApiUrl;
export const API_CONFIGURED = Boolean(configuredApiUrl);

// When true, services short-circuit to local mock data and never call the backend.
// Production-safe default: real services are used unless mock mode is explicitly enabled.
// Mock data is permitted only during local development.
// Production/staging builds can never silently switch to mock data.
export const USE_MOCK = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK === 'true';

const TOKEN_KEY = 'pu_auth_token';

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token: string): void {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* storage unavailable */ }
}

export function clearToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* storage unavailable */ }
}

const apiClient: AxiosInstance = axios.create({

  baseURL: API_URL ? `${API_URL}/api` : undefined,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Never fall back to localhost in a deployed build.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!API_CONFIGURED && !USE_MOCK) {
    return Promise.reject(new Error('Backend API is not configured. Set VITE_API_URL for real data services.'));
  }
  return config;
});

// Attach the bearer token to every outgoing request.
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize errors into a consistent shape the hooks can consume.
apiClient.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      try {
        cacheApiResponse(
          `${response.config.baseURL ?? ''}${response.config.url}`,
          JSON.stringify(response.data),
          new Headers({ 'content-type': 'application/json' }),
        );
      } catch { /* cache is best effort */ }
    }
    return response;
  },
  (error: AxiosError<{ detail?: string; message?: string }>) => {
    const config = error.config;
    const requestUrl = config?.url ? `${config.baseURL ?? ''}${config.url}` : '';
    if (config?.method?.toLowerCase() === 'get' && requestUrl && (isOffline() || !error.response)) {
      const cached = loadCachedApiResponse(requestUrl);
      if (cached) {
        return Promise.resolve({
          data: JSON.parse(cached.body),
          status: 200,
          statusText: 'OK (offline cache)',
          headers: cached.headers,
          config,
          request: undefined,
        });
      }
    }

    const message = isOffline()
      ? 'You are offline. Saved farm information is still available; live services will resume when you reconnect.'
      : error.response?.data?.detail ??
        error.response?.data?.message ??
        error.message ??
        'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  },
);

export default apiClient;
