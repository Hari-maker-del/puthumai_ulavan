export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ProductionEnvironment {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  geminiKey?: string;
  weatherKey?: string;
  useMock?: string;
}

export function validateProductionEnvironment(env: ProductionEnvironment): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const isMock = env.useMock === 'true';

  if (!env.supabaseUrl) {
    issues.push({
      code: 'SUPABASE_URL_MISSING',
      severity: isMock ? 'warning' : 'error',
      message: 'VITE_SUPABASE_URL is missing.',
    });
  }

  if (!env.supabaseAnonKey) {
    issues.push({
      code: 'SUPABASE_ANON_MISSING',
      severity: isMock ? 'warning' : 'error',
      message: 'VITE_SUPABASE_ANON_KEY is missing.',
    });
  }

  if (!env.geminiKey) {
    issues.push({
      code: 'GEMINI_KEY_MISSING',
      severity: 'warning',
      message: 'VITE_GEMINI_API_KEY is missing; AI features will be unavailable.',
    });
  }

  // Weather is now served through the same-origin Vercel function.
  // OPENWEATHER_API_KEY is intentionally server-side, so the old
  // VITE_OPENWEATHER_API_KEY is not required in production.
  if (!env.weatherKey) {
    issues.push({
      code: 'WEATHER_SERVER_KEY_NOT_IN_BROWSER',
      severity: 'warning',
      message: 'Weather uses the server-side /api/weather provider. No browser-exposed weather key is required.',
    });
  }

  if (!isMock && (!env.supabaseUrl || !env.supabaseAnonKey)) {
    issues.push({
      code: 'PRODUCTION_BACKEND_REQUIRED',
      severity: 'error',
      message: 'Production mode requires Supabase configuration.',
    });
  }

  return issues;
}
