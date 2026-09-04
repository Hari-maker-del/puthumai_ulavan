/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_API_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_DATA_GOV_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
