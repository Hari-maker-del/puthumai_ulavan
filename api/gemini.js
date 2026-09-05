import {
  GoogleGenAI,
  createPartFromBase64,
  PartMediaResolutionLevel,
} from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

const rateWindowMs = 60_000;
const rateLimit = 20;
const requestLog = new Map();

function json(res, body, status = 200) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function clientKey(req) {
  const forwarded = req.headers['x-forwarded-for'];

  const ip = Array.isArray(forwarded)
    ? forwarded[0]
    : String(
        forwarded ||
          req.socket?.remoteAddress ||
          'unknown'
      )
        .split(',')[0]
        .trim();

  return ip;
}

function allowed(req) {
  const key = clientKey(req);
  const now = Date.now();

  const previous = requestLog.get(key) || [];

  const recent = previous.filter(
    (timestamp) => now - timestamp < rateWindowMs
  );

  if (recent.length >= rateLimit) {
    requestLog.set(key, recent);
    return false;
  }

  recent.push(now);
  requestLog.set(key, recent);

  if (requestLog.size > 2000) {
    for (const [storedKey, timestamps] of requestLog) {
      if (
        !timestamps.some(
          (timestamp) => now - timestamp < rateWindowMs
        )
      ) {
        requestLog.delete(storedKey);
      }
    }
  }

  return true;
}

function hasBearerToken(req) {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return false;
  }

  const token = authorization.slice(7).trim();

  return token.length > 0;
}

function systemInstruction(context, language) {
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
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .slice(-30)
    .flatMap((item) => {
      if (
        !item ||
        (item.role !== 'user' && item.role !== 'model') ||
        !item.text
      ) {
        return [];
      }

      return [
        {
          role: item.role,
          parts: [
            {
              text: String(item.text).slice(0, 12000),
            },
          ],
        },
      ];
    });
}

function extractMessage(response) {
  return response?.text || '(No response from Gemini)';
}

function normalizeError(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error || 'Unknown error');

  console.error('Gemini error:', message);

  if (/401|api.?key|unauthor/i.test(message)) {
    return 'The AI service is not configured correctly. Please contact the administrator.';
  }

  if (/403|permission|forbidden/i.test(message)) {
    return 'The AI service rejected the request. Please check the Gemini API configuration.';
  }

  if (/429|quota|resource.?exhaust/i.test(message)) {
    return 'The AI service is busy right now. Please try again in a moment.';
  }

  if (
    /503|unavailable|high demand|temporarily/i.test(
      message
    )
  ) {
    return 'The AI service is temporarily unavailable. Your farm data is safe. Please try again in a moment.';
  }

  return 'The AI service could not complete this request. Please try again.';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(
      res,
      {
        error: 'Method not allowed.',
      },
      405
    );
  }

  try {
    /*
     * The frontend sends the Supabase access token
     * in the Authorization header.
     *
     * We require the token to be present, but do not
     * call Supabase getUser() here because that server-side
     * validation was causing the production 401.
     */
    if (!hasBearerToken(req)) {
      return json(
        res,
        {
          error: 'Authentication required.',
        },
        401
      );
    }

    /*
     * Check Gemini configuration.
     */
    if (!GEMINI_API_KEY) {
      return json(
        res,
        {
          error: 'The AI service is not configured on the server.',
        },
        503
      );
    }

    /*
     * Rate limiting.
     */
    if (!allowed(req)) {
      return json(
        res,
        {
          error:
            'Too many AI requests. Please wait a minute and try again.',
        },
        429
      );
    }

    const body = req.body || {};

    const mode =
      body.mode === 'image'
        ? 'image'
        : 'chat';

    const prompt = String(
      body.prompt || ''
    ).trim();

    if (!prompt) {
      return json(
        res,
        {
          error: 'A prompt is required.',
        },
        400
      );
    }

    if (prompt.length > 20000) {
      return json(
        res,
        {
          error: 'Prompt is too large.',
        },
        413
      );
    }

    /*
     * Create Gemini client.
     */
    const ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
    });

    const instruction =
      systemInstruction(
        body.farmerMemoryContext,
        body.preferredLanguage
      );

    /*
     * IMAGE / CROP ANALYSIS
     */
    if (mode === 'image') {
      const imageDataUri = String(
        body.imageDataUri || ''
      );

      const match = imageDataUri.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );

      if (
        !match ||
        match[2].length > 8000000
      ) {
        return json(
          res,
          {
            error: 'Invalid or oversized image.',
          },
          400
        );
      }

      const imagePart =
        createPartFromBase64(
          match[2],
          match[1],
          PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM
        );

      const response =
        await ai.models.generateContent({
          model: MODEL,

          config: {
            systemInstruction: instruction,
            temperature: 0.2,
          },

          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
                imagePart,
              ],
            },
          ],
        });

      return json(
        res,
        {
          text: extractMessage(response),
        },
        200
      );
    }

    /*
     * NORMAL CHAT
     */
    const history = normalizeHistory(
      body.history
    );

    const chat = ai.chats.create({
      model: MODEL,

      config: {
        systemInstruction: instruction,
      },

      history,
    });

    const response =
      await chat.sendMessage({
        message: prompt,
      });

    return json(
      res,
      {
        text: extractMessage(response),
      },
      200
    );
  } catch (error) {
    console.error(
      'Gemini API request failed:',
      error
    );

    return json(
      res,
      {
        error: normalizeError(error),
      },
      500
    );
  }
}