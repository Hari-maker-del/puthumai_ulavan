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


/** Detect the language of this turn so a previous UI preference cannot force English replies. */
function detectReplyLanguage(text: string, preferredLanguage?: string): string {
  // Tamil-script input is the strongest signal, including speech-to-text output.
  if (/[\u0B80-\u0BFF]/u.test(text)) {
    return 'Tamil (தமிழ்). Write the entire answer in natural Tamil using Tamil script. Do not mix in English sentences or Tanglish; keep only unavoidable crop/product names and standard units in their original form.';
  }

  // Speech recognition may return Tamil spoken words in Latin script (Tanglish).
  const tokens = text.toLowerCase().match(/[a-z]+/g) ?? [];
  const tamilRomanWords = new Set([
    'enna','epdi','eppadi','epadi','yen','yenn','ennaiku','eppo','enga','engaluku',
    'naan','nanga','neenga','nee','unga','ungal','irukku','iruka','irukaa','illa',
    'venum','vendum','pannunga','pannu','panrathu','panradhu','seiyanum','sollunga',
    'sollu','kudunga','kudu','aagum','aachu','varum','poga','poguma','seri','romba',
    'thanni','nel','vivasayam','vivasaayi','mannu','payir','uram','poochi','noi',
    'vivasayathuku','thottam','pasana','mazhai','nalla','konjam','ippo','innaiku',
    'naalaiku','irundha','iruntha','pottu','podanum','evlo','evalavu','eppadi'
  ]);
  const tamilHits = tokens.filter((token) => tamilRomanWords.has(token)).length;
  if (tamilHits >= 2 || (tamilHits >= 1 && tokens.length <= 5)) {
    return 'Tamil (தமிழ்), in natural everyday Tamil written in Tamil script. Translate the meaning of Tanglish input into a complete Tamil answer; do not reply in Tanglish or English sentences.';
  }

  // Only use the selected language for a very short ambiguous message; otherwise this turn's language wins.
  if (tokens.length <= 2 && preferredLanguage && !/^en(?:glish)?$/i.test(preferredLanguage.trim())) {
    return preferredLanguage;
  }
  return 'English. Answer completely in English.';
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
          preferredLanguage: detectReplyLanguage(text, preferredLanguage),
          // Everyday chat uses the fast model; image analysis keeps the full model.
          fastMode: true,
        });
        history = [...history, { role: 'user', text }, { role: 'model', text: response }].slice(-16);
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
    preferredLanguage: detectReplyLanguage(prompt, preferredLanguage),
    fastMode: Boolean(options.fastMode),
  });
}
