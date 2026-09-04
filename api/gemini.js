import { GoogleGenAI, createPartFromBase64, PartMediaResolutionLevel } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const SYSTEM_INSTRUCTION_BASE = `You are Uzhavan AI, a friendly and knowledgeable agricultural assistant for Indian farmers, specialised in Tamil Nadu farming.

Your expertise covers crop cultivation, Tamil Nadu agri seasons, soil, irrigation, pests and diseases, fertilizers, government schemes, market prices, FPOs and weather-based advisories.

Communication style:
- Warm, respectful, practical — speak like a trusted agri-officer.
- Give specific, actionable advice when the supplied farm context supports it.
- Use local context: Tamil Nadu districts, TNAU recommendations and state schemes.
- Keep answers concise but complete; use bullet points for multi-step advice.
- Reference the farmer profile directly when it is supplied.
- Respond in the farmer's preferred language when specified.

Safety and truthfulness:
- Never fabricate live weather, market prices, alerts, expenses, yields, farm records, or crop-health observations.
- If a requested live source is unavailable, explicitly say that it is unavailable.
- Do not present an uncertain crop diagnosis or treatment as a guaranteed fact.
- For pesticide/fertilizer treatment, encourage label/TNAU/KVK verification.
- When evidence is incomplete, say what is known, what is uncertain, and what the farmer should check.
- For complex or high-risk crop problems, recommend contacting a local agricultural expert/KVK.

Never claim that a recommendation is based on live data unless that live data is present in the supplied farm context.`;

// In-memory rate-limit store (resets per serverless instance lifecycle).
const rateWindowMs = 60_000;
const rateLimit = 20;
const requestLog = new Map();

function json(res, body, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function clientKey(req, userId) {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(forwarded || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  return `${userId}:${ip}`;
}

function allowed(req, userId) {
  const key = clientKey(req, userId);
  const now = Date.now();
  const previous = requestLog.get(key) || [];
  const recent = previous.filter(ts => now - ts < rateWindowMs);
  if (recent.length >= rateLimit) {
    requestLog.set(key, recent);
    return false;
  }
  recent.push(now);
  requestLog.set(key, recent);
  // Prune stale entries periodically to avoid unbounded growth.
  if (requestLog.size > 2000) {
    for (const [k, timestamps] of requestLog) {
      if (!timestamps.some(ts => now - ts < rateWindowMs)) requestLog.delete(k);
    }
  }
  return true;
}

function bearer(req) {
  const value = req.headers.authorization || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

async function authenticate(req) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase server authentication is not configured.');
  }
  const token = bearer(req);
  if (!token) throw new Error('Authentication required.');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new Error('Authentication required.');
  return data.user.id;
}

/**
 * Build the system instruction string.
 * Returns a string — never pass this function itself as the value.
 */
function buildSystemInstruction(context, language) {
  let value = SYSTEM_INSTRUCTION_BASE;
  if (context && String(context).trim()) {
    value += `\n\nFARMER CONTEXT:\n${String(context).trim()}`;
  }
  if (language && language !== 'en') {
    value += `\n\nIMPORTANT: Respond primarily in ${String(language)}.`;
  }
  return value;
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history.slice(-30).flatMap(item => {
    if (!item || (item.role !== 'user' && item.role !== 'model') || !item.text) return [];
    return [{ role: item.role, parts: [{ text: String(item.text).slice(0, 12_000) }] }];
  });
}

function extractText(response) {
  // response.text is a getter on GenerateContentResponse — access it safely.
  try {
    const t = response?.text;
    return typeof t === 'string' && t.trim() ? t : '(No response from Gemini)';
  } catch {
    return '(No response from Gemini)';
  }
}

function normalizeError(error) {
  const msg = error instanceof Error ? error.message : String(error || 'Unknown error');
  if (/401|api.?key|unauthor/i.test(msg)) {
    return 'The AI service is not configured correctly. Please contact the administrator.';
  }
  if (/429|quota|resource.?exhaust/i.test(msg)) {
    return 'The AI service is busy right now. Please try again in a moment.';
  }
  if (/503|unavailable|high demand|temporarily/i.test(msg)) {
    return 'The AI service is temporarily unavailable. Your farm data is safe. Please try again in a moment.';
  }
  return 'The AI service could not complete this request. Please try again.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, { error: 'Method not allowed.' }, 405);

  let userId;
  try {
    userId = await authenticate(req);
  } catch (error) {
    return json(res, { error: error instanceof Error ? error.message : 'Authentication required.' }, 401);
  }

  try {
    if (!allowed(req, userId)) {
      return json(res, { error: 'Too many AI requests. Please wait a minute and try again.' }, 429);
    }
    if (!GEMINI_API_KEY) {
      return json(res, { error: 'The AI service is not configured on the server. Set GEMINI_API_KEY in Vercel environment variables.' }, 503);
    }

    const body = req.body || {};
    const mode = body.mode === 'image' ? 'image' : 'chat';
    const prompt = String(body.prompt || '').trim();
    if (!prompt) return json(res, { error: 'A prompt is required.' }, 400);
    if (prompt.length > 20_000) return json(res, { error: 'Prompt is too large.' }, 413);

    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Build the instruction STRING — previously this was accidentally passed as a
    // function reference ({ systemInstruction } shorthand) which silently sent
    // the function object to the API instead of the text, breaking all AI responses.
    const systemInstruction = buildSystemInstruction(
      body.farmerMemoryContext,
      body.preferredLanguage,
    );

    if (mode === 'image') {
      const imageDataUri = String(body.imageDataUri || '');
      const match = imageDataUri.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return json(res, { error: 'Invalid image format. Expected a data URI.' }, 400);
      if (match[2].length > 8_000_000) return json(res, { error: 'Image is too large. Please use an image under 6 MB.' }, 400);

      const imagePart = createPartFromBase64(
        match[2],
        match[1],
        PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM,
      );

      const response = await ai.models.generateContent({
        model: MODEL,
        config: { systemInstruction, temperature: 0.2 },
        contents: [{ role: 'user', parts: [{ text: prompt }, imagePart] }],
      });

      return json(res, { text: extractText(response) });
    }

    // Chat mode
    const history = normalizeHistory(body.history);
    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction },   // ← string value, not the function
      history,
    });

    const response = await chat.sendMessage({ message: prompt });
    return json(res, { text: extractText(response) });

  } catch (error) {
    console.error('[gemini proxy] Unhandled error:', error);
    return json(res, { error: normalizeError(error) }, 500);
  }
}
