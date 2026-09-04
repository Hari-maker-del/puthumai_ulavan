import { createClient } from '@supabase/supabase-js';
import { offlineAwareFetch } from '@/services/offlineFetch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Export a flag so components can show a helpful error instead of crashing.
export const supabaseMisconfigured = !supabaseUrl || !supabaseAnonKey;

// Supabase persists the session in browser localStorage. These settings are
// intentionally explicit because session persistence is a production requirement.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      global: { fetch: offlineAwareFetch },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder_key', {
      auth: { persistSession: false },
    });
