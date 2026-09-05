const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION_BASE = `You are Uzhavan AI, a friendly and knowledgeable agricultural assistant for Indian farmers, specialised in Tamil Nadu farming.

Your expertise covers crop cultivation, Tamil Nadu agri seasons, soil, irrigation, pests and diseases, fertilizers, government schemes, market prices, FPOs and weather-based advisories.

Communication style:
- Warm, respectful, practical — speak like a trusted agri-officer.
- Give specific, actionable advice when the supplied farm context supports it.
- Use local context: Tamil Nadu districts, TNAU recommendations and state schemes.
- Keep answers concise but complete.
- Use bullet points for multi-step advice.
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
  res.status(status);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];

  return Array.isArray(forwarded)
    ? forwarded[0]
    : String(
        forwarded ||
          req.socket?.remoteAddress ||
          'unknown'
      )
        .split(',')[0]
        .trim();
}

function allowed(req) {
  const key = getClientIp(req);
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

function buildSystemInstruction(context, language) {
  let instruction = SYSTEM_INSTRUCTION_BASE;

  if (context && String(context).trim()) {
    instruction += `\n\nFARMER CONTEXT:\n${String(
      context
    ).trim()}`;
  }

  if (language && language !== 'en') {
    instruction += `\n\nIMPORTANT: Respond primarily in ${String(
      language
    )}.`;
  }

  return instruction;
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
        (item.role !== 'user' &&
          item.role !== 'model') ||
        !item.text
      ) {
        return [];
      }

      return [
        {
          role: item.role,
          parts: [
            {
              text: String(item.text).slice(
                0,
                12000
              ),
            },
          ],
        },
      ];
    });
}

function extractGeminiText(data) {
  const candidates = data?.candidates;

  if (!Array.isArray(candidates) || candidates.length === 0) {
    return '';
  }

  const parts =
    candidates[0]?.content?.parts || [];

  return parts
    .filter((part) => part && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
}

async function callGemini(contents, systemInstruction) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is missing on the server.'
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(MODEL)}:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const payload = {
    systemInstruction: {
      parts: [
        {
          text: systemInstruction,
        },
      ],
    },
    contents,
    generationConfig: {
      temperature: 0.2,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error(
      'Gemini HTTP error:',
      response.status,
      JSON.stringify(data)
    );

    const apiMessage =
      data?.error?.message ||
      `Gemini request failed with status ${response.status}`;

    throw new Error(apiMessage);
  }

  const text = extractGeminiText(data);

  if (!text) {
    throw new Error(
      'Gemini returned an empty response.'
    );
  }

  return text;
}

function normalizeError(error) {
  const message =
    error instanceof Error
      ? error.message
      : String(error || 'Unknown error');

  console.error(
    'Gemini API error:',
    message
  );

  if (
    /API key not valid|api key|invalid.*key/i.test(
      message
    )
  ) {
    return 'The Gemini API key is invalid. Please update GEMINI_API_KEY in Vercel.';
  }

  if (
    /quota|resource exhausted|429/i.test(
      message
    )
  ) {
    return 'The Gemini API quota has been reached. Please try again later.';
  }

  if (
    /permission|forbidden|403/i.test(
      message
    )
  ) {
    return 'The Gemini API key does not have permission to use this model.';
  }

  if (
    /not found|404|model/i.test(message)
  ) {
    return `The Gemini model "${MODEL}" is unavailable. Check GEMINI_MODEL in Vercel.`;
  }

  if (
    /503|unavailable|overloaded/i.test(
      message
    )
  ) {
    return 'Gemini is temporarily unavailable. Please try again.';
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
     * The frontend already sends the Supabase
     * access token.
     *
     * We require the Bearer token but do not perform
     * server-side Supabase JWT validation here because
     * that was causing the production 401.
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

    if (!GEMINI_API_KEY) {
      return json(
        res,
        {
          error:
            'GEMINI_API_KEY is missing on the server.',
        },
        503
      );
    }

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

    const instruction =
      buildSystemInstruction(
        body.farmerMemoryContext,
        body.preferredLanguage
      );

    const history = normalizeHistory(
      body.history
    );

    /*
     * IMAGE / CROP ANALYSIS
     */
    if (body.mode === 'image') {
      const imageDataUri = String(
        body.imageDataUri || ''
      );

      const match = imageDataUri.match(
        /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
      );

      if (!match) {
        return json(
          res,
          {
            error: 'Invalid image data.',
          },
          400
        );
      }

      if (match[2].length > 8000000) {
        return json(
          res,
          {
            error: 'Image is too large.',
          },
          413
        );
      }

      const contents = [
        {
          role: 'user',
          parts: [
            {
              text: prompt,
            },
            {
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            },
          ],
        },
      ];

      const text = await callGemini(
        contents,
        instruction
      );

      return json(
        res,
        {
          text,
        },
        200
      );
    }

    /*
     * NORMAL CHAT
     */
    const contents = [
      ...history,
      {
        role: 'user',
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ];

    const text = await callGemini(
      contents,
      instruction
    );

    return json(
      res,
      {
        text,
      },
      200
    );
  } catch (error) {
    return json(
      res,
      {
        error: normalizeError(error),
      },
      500
    );
  }
}