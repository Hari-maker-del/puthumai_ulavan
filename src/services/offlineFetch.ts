import {
  cacheApiResponse,
  isOffline,
  loadCachedApiResponse,
  queueOfflineRequest,
} from '@/services/offlineService';

const REST_MARKER = '/rest/v1/';
const AUTH_MARKER = '/auth/';
const STORAGE_MARKER = '/storage/';

function toHeaderRecord(headers: HeadersInit | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  new Headers(headers).forEach((value, key) => { result[key] = value; });
  return result;
}

function isSupabaseRest(url: string): boolean {
  return url.includes(REST_MARKER);
}

function canQueueMutation(url: string, method: string): boolean {
  if (!isSupabaseRest(url)) return false;
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false;
  if (url.includes(AUTH_MARKER) || url.includes(STORAGE_MARKER)) return false;
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
}

function inferIdFromUrl(url: string): string | null {
  try {
    const match = new URL(url).searchParams.get('id');
    if (!match) return null;
    const value = match.replace(/^eq\./, '');
    return value || null;
  } catch {
    return null;
  }
}

function offlineMutationResponse(method: string, body: string | undefined, url: string): Response {
  // PostgREST returns arrays for mutations using .select(). Returning the
  // submitted payload lets existing .select().single() service calls remain
  // usable offline while the exact request is queued for the server.
  let payload: Record<string, unknown> = {};
  try {
    if (body) {
      const parsed = JSON.parse(body);
      payload = Array.isArray(parsed) ? (parsed[0] ?? {}) : (parsed ?? {});
    }
  } catch { /* keep an empty optimistic response */ }

  if (method === 'DELETE') {
    return new Response(null, { status: 204, headers: { 'content-type': 'application/json' } });
  }

  if (!payload.id) {
    payload.id = inferIdFromUrl(url) ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined);
  }
  return new Response(JSON.stringify([payload]), {
    status: 201,
    headers: { 'content-type': 'application/json', 'content-range': '0-0/1' },
  });
}

export async function offlineAwareFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const request = input instanceof Request ? input : new Request(input, init);
  const url = request.url;
  const method = request.method.toUpperCase();

  if (isOffline()) {
    if (method === 'GET' && isSupabaseRest(url)) {
      const cached = loadCachedApiResponse(url);
      if (cached) {
        return new Response(cached.body, { status: 200, headers: cached.headers });
      }
    }

    if (canQueueMutation(url, method)) {
      const body = await request.clone().text();
      queueOfflineRequest({ url, method, headers: toHeaderRecord(request.headers), body });
      return offlineMutationResponse(method, body, url);
    }
  }

  try {
    const response = await fetch(request);
    if (response.ok && method === 'GET' && isSupabaseRest(url)) {
      const clone = response.clone();
      const body = await clone.text();
      cacheApiResponse(url, body, response.headers);
    }
    return response;
  } catch (error) {
    if (method === 'GET' && isSupabaseRest(url)) {
      const cached = loadCachedApiResponse(url);
      if (cached) return new Response(cached.body, { status: 200, headers: cached.headers });
    }
    if (canQueueMutation(url, method)) {
      const body = await request.clone().text();
      queueOfflineRequest({ url, method, headers: toHeaderRecord(request.headers), body });
      return offlineMutationResponse(method, body, url);
    }
    throw error;
  }
}
