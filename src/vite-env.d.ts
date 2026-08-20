/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  /** Local development only. Production weather uses the server-side OPENWEATHER_API_KEY. */
  readonly VITE_OPENWEATHER_API_KEY?: string;
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_GEMINI_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
