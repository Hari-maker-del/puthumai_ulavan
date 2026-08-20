# Vercel Production Readiness
Set only required real variables:
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL
VITE_GEMINI_API_KEY
VITE_OPENWEATHER_API_KEY
Never expose Supabase service-role keys in VITE_* variables.
Apply Supabase migrations, verify RLS, configure email callback, deploy Preview,
then test signup/verification/farm/crop/expense/realtime/offline on a real Android device.
