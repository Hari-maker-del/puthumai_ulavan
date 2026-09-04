export interface ValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface ProductionEnvironment {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  geminiServerConfigured?: boolean;
  dataGovKey?: string;
  useMock?: string;
}

export function validateProductionEnvironment(env: ProductionEnvironment): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const isMock = env.useMock === 'true';

  if (!env.supabaseUrl) issues.push({ code: 'SUPABASE_URL_MISSING', severity: isMock ? 'warning' : 'error', message: 'VITE_SUPABASE_URL is missing.' });
  if (!env.supabaseAnonKey) issues.push({ code: 'SUPABASE_ANON_MISSING', severity: isMock ? 'warning' : 'error', message: 'VITE_SUPABASE_ANON_KEY is missing.' });
  if (env.geminiServerConfigured === false) issues.push({ code: 'GEMINI_SERVER_MISSING', severity: 'warning', message: 'Server-side Gemini configuration is missing; AI features will be unavailable.' });
  if (!env.dataGovKey) issues.push({ code: 'DATA_GOV_KEY_MISSING', severity: 'warning', message: 'VITE_DATA_GOV_API_KEY is missing; official mandi prices will use verified Supabase records only.' });

  if (!isMock && (!env.supabaseUrl || !env.supabaseAnonKey)) {
    issues.push({ code: 'PRODUCTION_BACKEND_REQUIRED', severity: 'error', message: 'Production mode requires Supabase configuration.' });
  }

  return issues;
}
