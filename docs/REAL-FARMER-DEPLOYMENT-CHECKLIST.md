# Real Farmer Deployment Checklist

## Vercel
Required production variables (only those actually used by the project):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_GEMINI_API_KEY (if AI is enabled)
- OPENWEATHER_API_KEY (server-side, if OpenWeather is enabled)
- VITE_USE_MOCK=false for real production data

Never put service-role keys in Vite/client variables.

## Supabase
- Apply realtime migration.
- Apply/review RLS.
- Configure email confirmation.
- Configure production callback:
  https://puthumai-ulavan.vercel.app/auth/callback
- Test two-user isolation.
- Verify Realtime publication/subscriptions.

## Real farmer onboarding
New account → verification → profile → farm → crop → expense → recommendation.

## Production smoke
- No white screen with any external API failure.
- No demo data presented as live farmer data.
- Realtime updates appear on second device.
- Offline/reconnect doesn't create duplicates.
