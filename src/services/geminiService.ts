/**
 * geminiService.ts
 * ─────────────────────────────────────────────────────────────
 * Wraps @google/genai for the Puthumai Uzhavan AI Assistant.
 *
 * Features:
 *  • Persistent farmer memory context
 *  • Language-aware system instruction
 *  • Text chat
 *  • Image-based crop/plant analysis
 *  • Production-safe API-key handling
 *  • Clear error messages
 * ─────────────────────────────────────────────────────────────
 */

import {
  GoogleGenAI,
  createPartFromBase64,
  PartMediaResolutionLevel,
  type Chat,
} from '@google/genai';

import type { ChatMessage } from '@/services/types';

const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';

// Gemini 2.0 Flash was shut down on June 1, 2026. Keep the app resilient
// if an older Vercel/.env value is still present by automatically migrating
// the known legacy model IDs to the current stable production model.
const configuredModel = import.meta.env.VITE_GEMINI_MODEL?.trim();
const normalizedModel = configuredModel?.replace(/^models\//, '');
const LEGACY_GEMINI_MODELS = new Set([
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
]);

const MODEL =
  !normalizedModel || LEGACY_GEMINI_MODELS.has(normalizedModel)
    ? DEFAULT_GEMINI_MODEL
    : normalizedModel;

const SYSTEM_INSTRUCTION_BASE = `You are Uzhavan AI, a friendly and knowledgeable agricultural assistant for Indian farmers, specialised in Tamil Nadu farming.

Your expertise covers:
- Crop cultivation: paddy, sugarcane, banana, tomato, groundnut, maize, black gram, cotton, millets
- Tamil Nadu agri seasons: Kharif (Jun–Sep), Rabi (Oct–Jan), Zaid (Feb–May)
- Soil types: red soil, black soil, alluvial, laterite
- Irrigation: drip, sprinkler, flood; canal networks; bore wells
- Pests & diseases: early blight, blast, fall armyworm, stem borer, red rot, powdery mildew
- Fertilizers: urea, DAP, MOP, micronutrients; organic inputs; bio-fertilisers
- Government schemes: PM-KISAN, PMFBY, Soil Health Card, TNAU services, Fasal Bima Yojana, eNAM
- Market prices, mandi rates, FPOs, NAFED
- Weather-based advisories

Communication style:
- Warm, respectful, practical — speak like a trusted agri-officer
- Give specific, actionable advice
- Use local context: Tamil Nadu districts, TNAU recommendations, state schemes
- Keep answers concise but complete
- Use bullet points for multi-step advice
- When the farmer's profile is provided, reference it directly
- Respond in the farmer's preferred language when specified
- Tamil is strongly preferred
- Mix Tamil terms naturally when appropriate

Safety and truthfulness:
- Never fabricate live weather, market prices, alerts, expenses, yields, farm records, or crop-health observations.
- If a requested live source is unavailable, explicitly say that it is unavailable.
- Do not present an uncertain crop diagnosis or treatment as guaranteed fact.
- For pesticide/fertilizer treatment, avoid unsafe or banned products and encourage label/TNAU/KVK verification.
- When evidence is incomplete, say what is known, what is uncertain, and what the farmer should check.
- For complex or high-risk crop problems, recommend contacting a local agricultural expert/KVK.

Answer format when appropriate:
Situation
Recommendation
What to do now
Warning
When to contact an agricultural expert

Never claim that a recommendation is based on live data unless that live data is present in the supplied farm context.`;

function buildSystemInstruction(
  farmerMemoryContext?: string,
  preferredLanguage?: string,
): string {
  let instruction = SYSTEM_INSTRUCTION_BASE;

  if (farmerMemoryContext?.trim()) {
    instruction += `\n\n${farmerMemoryContext.trim()}`;
  }

  if (preferredLanguage && preferredLanguage !== 'en') {
    const langNames: Record<string, string> = {
      ta: 'Tamil (தமிழ்)',
      hi: 'Hindi (हिंदी)',
      te: 'Telugu (తెలుగు)',
      ml: 'Malayalam (മലയാളം)',
      kn: 'Kannada (ಕನ್ನಡ)',
    };

    const langName =
      langNames[preferredLanguage] ?? preferredLanguage;

    instruction += `\n\nIMPORTANT: This farmer prefers ${langName}. Respond primarily in ${langName} and mix in simple English only for technical terms and scheme names.`;
  }

  return instruction;
}

export interface GeminiSession {
  sendMessage: (text: string) => Promise<string>;
}

function getApiKey(): string | null {
  const key = import.meta.env.VITE_GEMINI_API_KEY;

  if (!key || !key.trim()) {
    return null;
  }

  return key.trim();
}

function getFriendlyGeminiError(error: unknown): Error {
  const message =
    error instanceof Error
      ? error.message
      : 'Unknown Gemini error';

  const lower = message.toLowerCase();

  if (
    lower.includes('api key') ||
    lower.includes('api_key') ||
    lower.includes('401') ||
    lower.includes('unauthorized')
  ) {
    return new Error(
      'Invalid Gemini API key. Check VITE_GEMINI_API_KEY in your .env.local file.',
    );
  }

  if (
    lower.includes('429') ||
    lower.includes('quota') ||
    lower.includes('rate limit')
  ) {
    return new Error(
      'Gemini rate limit reached. Please wait a moment and try again.',
    );
  }

  if (
    lower.includes('403') ||
    lower.includes('permission')
  ) {
    return new Error(
      'Gemini API access was denied. Check your API key and Google AI Studio project settings.',
    );
  }

  if (
    lower.includes('404') ||
    lower.includes('not found')
  ) {
    return new Error(
      `Gemini model "${MODEL}" was not found or is unavailable for this API key.`,
    );
  }

  if (
    lower.includes('network') ||
    lower.includes('fetch') ||
    lower.includes('failed to fetch')
  ) {
    return new Error(
      'Unable to connect to Gemini. Check your internet connection and try again.',
    );
  }

  return new Error(`Gemini error: ${message}`);
}

export function createGeminiSession(
  seedMessages: ChatMessage[] = [],
  farmerMemoryContext?: string,
  preferredLanguage?: string,
): GeminiSession {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      sendMessage: async () =>
        '⚠️ Gemini API key is not configured.\n\nPlease add VITE_GEMINI_API_KEY to your .env.local file and restart the development server.',
    };
  }

  const history: {
    role: 'user' | 'model';
    parts: { text: string }[];
  }[] = [];

  let i = 0;

  while (i < seedMessages.length) {
    const msg = seedMessages[i];

    if (msg.role === 'user') {
      const userTurn = {
        role: 'user' as const,
        parts: [{ text: msg.text }],
      };

      const next = seedMessages[i + 1];

      if (next?.role === 'assistant') {
        history.push(userTurn);
        history.push({
          role: 'model',
          parts: [{ text: next.text }],
        });
        i += 2;
      } else {
        history.push(userTurn);
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  let chat: Chat | null = null;

  const systemInstruction = buildSystemInstruction(
    farmerMemoryContext,
    preferredLanguage,
  );

  const getChat = (): Chat => {
    if (!chat) {
      chat = ai.chats.create({
        model: MODEL,
        config: {
          systemInstruction,
        },
        history,
      });
    }

    return chat;
  };

  return {
    sendMessage: async (text: string): Promise<string> => {
      const cleanText = text.trim();

      if (!cleanText) {
        throw new Error('Please enter a message before sending.');
      }

      try {
        const response = await getChat().sendMessage({
          message: cleanText,
        });

        return (
          response.text?.trim() ||
          '(No response from Gemini)'
        );
      } catch (error) {
        throw getFriendlyGeminiError(error);
      }
    },
  };
}

function getMimeTypeFromDataUri(
  dataUri: string,
): string {
  const match = dataUri.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,/,
  );

  return match?.[1] ?? 'image/png';
}

function getDataFromDataUri(
  dataUri: string,
): string {
  const commaIndex = dataUri.indexOf(',');

  return commaIndex >= 0
    ? dataUri.slice(commaIndex + 1)
    : dataUri;
}

export async function askGeminiWithImage(
  prompt: string,
  imageDataUri: string,
): Promise<string> {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new Error(
      'Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env.local.',
    );
  }

  if (!prompt.trim()) {
    throw new Error(
      'Please provide a question for the image.',
    );
  }

  if (!imageDataUri.startsWith('data:image/')) {
    throw new Error(
      'Invalid image data. Please select or capture a valid image.',
    );
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const chat = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_BASE,
      },
    });

    const mimeType =
      getMimeTypeFromDataUri(imageDataUri);

    const base64Data =
      getDataFromDataUri(imageDataUri);

    const imagePart = createPartFromBase64(
      base64Data,
      mimeType,
      PartMediaResolutionLevel.MEDIA_RESOLUTION_MEDIUM,
    );

    const response = await chat.sendMessage({
      message: [imagePart, prompt.trim()],
    });

    return (
      response.text?.trim() ||
      '(No response from Gemini)'
    );
  } catch (error) {
    throw getFriendlyGeminiError(error);
  }
}

export async function askGemini(
  prompt: string,
  farmerMemoryContext?: string,
  preferredLanguage?: string,
): Promise<string> {
  const session = createGeminiSession(
    [],
    farmerMemoryContext,
    preferredLanguage,
  );

  return session.sendMessage(prompt);
}