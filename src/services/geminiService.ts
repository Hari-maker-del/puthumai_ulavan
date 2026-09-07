/** Client-side Gemini gateway. The API key stays server-side. */
import type { ChatMessage } from '@/services/types';
import { supabase } from '@/lib/supabase';

export interface GeminiSession { sendMessage: (text: string) => Promise<string>; }
export interface GeminiRequestOptions { fastMode?: boolean; }

type GeminiPayload = { text?: string; error?: string };

async function getAccessToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session?.access_token) return data.session.access_token;
  }

  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return data.session.access_token;

  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (!error && refreshed.session?.access_token) return refreshed.session.access_token;

  throw new Error('Please sign in again to use Uzhavan AI.');
}

async function requestGemini(body: Record<string, unknown>, token: string): Promise<Response> {
  return fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
}

async function readPayload(response: Response): Promise<GeminiPayload> {
  try {
    return await response.json() as GeminiPayload;
  } catch {
    return {};
  }
}

async function callGemini(body: Record<string, unknown>): Promise<string> {
  let token = await getAccessToken();
  let response = await requestGemini(body, token);
  let payload = await readPayload(response);

  // A stale access token can survive in the browser briefly. Refresh once and
  // retry only on authentication failure; all other errors keep their server detail.
  if (response.status === 401) {
    token = await getAccessToken(true);
    response = await requestGemini(body, token);
    payload = await readPayload(response);
  }

  if (!response.ok) {
    throw new Error(payload.error || 'The AI service could not complete this request.');
  }
  return payload.text || '(No response from Gemini)';
}

function buildHistory(seedMessages: ChatMessage[]): { role: 'user' | 'model'; text: string }[] {
  return seedMessages.flatMap((m) =>
    m.role === 'user'
      ? [{ role: 'user' as const, text: m.text }]
      : m.role === 'assistant'
        ? [{ role: 'model' as const, text: m.text }]
        : [],
  );
}

export function createGeminiSession(
  seedMessages: ChatMessage[] = [],
  farmerMemoryContext?: string,
  preferredLanguage?: string,
): GeminiSession {
  let history = buildHistory(seedMessages);
  let busy = false;
  return {
    sendMessage: async (text) => {
      if (busy) throw new Error('The previous AI request is still processing. Please wait a moment.');
      busy = true;
      try {
        const response = await callGemini({
          mode: 'chat',
          prompt: text,
          history,
          farmerMemoryContext,
          preferredLanguage,
        });
        history = [...history, { role: 'user', text }, { role: 'model', text: response }].slice(-30);
        return response;
      } finally {
        busy = false;
      }
    },
  };
}

export async function askGeminiWithImage(prompt: string, imageDataUri: string): Promise<string> {
  return callGemini({ mode: 'image', prompt, imageDataUri });
}

export async function askGemini(
  prompt: string,
  farmerMemoryContext?: string,
  preferredLanguage?: string,
  options: GeminiRequestOptions = {},
): Promise<string> {
  return callGemini({
    mode: 'chat',
    prompt,
    history: [],
    farmerMemoryContext,
    preferredLanguage,
    fastMode: Boolean(options.fastMode),
  });
}
