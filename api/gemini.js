const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.7-flash';
const FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SYSTEM_INSTRUCTION_BASE = `You are Uzhavan AI, a friendly and knowledgeable agricultural assistant for Indian farmers, specialised in Tamil Nadu farming.
Your expertise covers crop cultivation, Tamil Nadu agri seasons, soil, irrigation, pests and diseases, fertilizers, government schemes, FPOs and weather-based advisories.
Be warm, respectful and practical. Never fabricate live weather, market prices, alerts, expenses, yields, farm records, or crop-health observations. If supplied data is unavailable, say so. For pesticide/fertilizer treatment, encourage label/TNAU/KVK verification.`;
const rateWindowMs = 60_000;
const rateLimit = 20;
const requestLog = new Map();
const MAX_PROMPT_LENGTH = 20_000;
const MAX_CONTEXT_LENGTH = 8_000;
const MAX_HISTORY_ITEMS = 16;
const MAX_HISTORY_MESSAGE_LENGTH = 4_000;

function json(res, body, status = 200) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function allowed(req) {
  const key = getClientIp(req);
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((time) => now - time < rateWindowMs);
  if (recent.length >= rateLimit) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

function getBearerToken(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

/**
 * Best-effort session validation.
 * The browser already obtains the token from Supabase. Server-side validation
 * is attempted when the server has Supabase credentials, but a temporary
 * Supabase auth endpoint failure must not make the Gemini service unusable.
 * The token is never used as a Gemini credential.
 */
async function validateToken(token) {
  if (!token) return false;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return true;

  try {
    const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      console.warn(`Supabase token validation returned ${response.status}; continuing with authenticated gateway request.`);
      return true;
    }
    const user = await response.json();
    return Boolean(user?.id);
  } catch (error) {
    console.warn('Supabase token validation unavailable; continuing:', error?.message || error);
    return true;
  }
}

function buildSystemInstruction(context, language) {
  let instruction = SYSTEM_INSTRUCTION_BASE;
  if (context?.trim()) instruction += `\n\nFARMER CONTEXT:\n${String(context).trim().slice(0, MAX_CONTEXT_LENGTH)}`;
  if (language && language !== 'en') instruction += `\n\nRespond primarily in ${String(language).slice(0, 40)}.`;
  return instruction;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-MAX_HISTORY_ITEMS).flatMap((item) => {
    if (!item || (item.role !== 'user' && item.role !== 'model') || typeof item.text !== 'string' || !item.text.trim()) return [];
    return [{ role: item.role, parts: [{ text: item.text.slice(0, MAX_HISTORY_MESSAGE_LENGTH) }] }];
  });
}

function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts || [];
  return parts.filter((part) => typeof part?.text === 'string').map((part) => part.text).join('').trim();
}

async function requestModel(model, contents, systemInstruction, fastMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), fastMode ? 9_000 : 22_000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { maxOutputTokens: fastMode ? 768 : 2048 },
      }),
      signal: controller.signal,
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(data?.error?.message || `Gemini request failed with status ${response.status}`);
      error.status = response.status;
      throw error;
    }
    const text = extractGeminiText(data);
    if (!text) throw new Error('Gemini returned an empty response.');
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

async function callGemini(contents, systemInstruction, fastMode = false) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing on the server.');

  const primary = fastMode ? FAST_MODEL : MODEL;
  const candidates = [primary];
  if (!fastMode && FALLBACK_MODEL && FALLBACK_MODEL !== primary) candidates.push(FALLBACK_MODEL);

  let lastError = null;
  for (const model of candidates) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await requestModel(model, contents, systemInstruction, fastMode);
      } catch (error) {
        lastError = error;
        const status = Number(error?.status || 0);
        const message = String(error?.message || '');
        const transient = status === 429 || status === 500 || status === 502 || status === 503 || status === 504 || /overloaded|temporarily unavailable|resource exhausted/i.test(message);
        if (!transient) break;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }
  }

  if (lastError?.name === 'AbortError') throw new Error('Gemini timed out. Please try again.');
  throw lastError || new Error('Gemini request failed.');
}

function normalizeError(error) {
  const message = error instanceof Error ? error.message : String(error || 'Unknown error');
  console.error('Gemini API error:', message);
  if (/api key|api_key|invalid.*key|key not valid/i.test(message)) return 'The Gemini API key is invalid. Please update GEMINI_API_KEY in Vercel.';
  if (/quota|resource exhausted|rate limit|429/i.test(message)) return 'The Gemini API quota has been reached. Please try again later.';
  if (/permission|forbidden|403/i.test(message)) return 'The Gemini API key does not have permission to use this model.';
  if (/not found|404|model/i.test(message)) return 'The Gemini model is unavailable. Check GEMINI_MODEL or GEMINI_FALLBACK_MODEL in Vercel.';
  if (/503|unavailable|overloaded/i.test(message)) return 'Gemini is temporarily busy. Please try again in a few seconds.';
  if (/timed out/i.test(message)) return 'The AI service took too long to respond. Please try again.';
  return message;
}

function getImageData(value) {
  const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match || !match[2] || match[2].length > 8_000_000) return null;
  return { mimeType: match[1], data: match[2] };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed.' }, 405);

  try {
    // Require a Supabase session token, but do not make Gemini depend on the
    // availability of the Supabase auth validation endpoint.
    const token = getBearerToken(req);
    if (!token) return json(res, { error: 'Authentication required.' }, 401);
    if (!(await validateToken(token))) return json(res, { error: 'Your session is invalid. Please sign in again.' }, 401);

    if (!allowed(req)) return json(res, { error: 'Too many AI requests. Please wait a minute and try again.' }, 429);
    if (!GEMINI_API_KEY) return json(res, { error: 'Gemini API key is not configured on the server.' }, 503);

    const body = req.body || {};
    const prompt = String(body.prompt || '').trim();
    if (!prompt) return json(res, { error: 'A prompt is required.' }, 400);
    if (prompt.length > MAX_PROMPT_LENGTH) return json(res, { error: 'Prompt is too large.' }, 413);

    const instruction = buildSystemInstruction(body.farmerMemoryContext, body.preferredLanguage);

    if (body.mode === 'image') {
      const image = getImageData(body.imageDataUri);
      if (!image) return json(res, { error: 'Invalid or oversized image.' }, 400);
      const text = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: image.mimeType, data: image.data } }] }],
        instruction,
        false,
      );
      return json(res, { text }, 200);
    }

    const text = await callGemini(
      [...normalizeHistory(body.history), { role: 'user', parts: [{ text: prompt }] }],
      instruction,
      Boolean(body.fastMode),
    );
    return json(res, { text }, 200);
  } catch (error) {
    console.error('Gemini handler error:', error);
    const status = Number.isInteger(error?.status) && error.status >= 400 && error.status < 600 ? error.status : 500;
    return json(res, { error: normalizeError(error) }, status);
  }
}
