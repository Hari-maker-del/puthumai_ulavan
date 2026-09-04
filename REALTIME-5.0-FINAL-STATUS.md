# Puthumai Uzhavan — Real-Time Farmer Ready Candidate

Implemented:
- Supabase Realtime manager with reconnect/backoff
- live table subscriptions for farmer data
- connectivity detection
- realtime health check
- realtime publication migration
- realtime status UI component
- live acceptance checklist
- two-user RLS acceptance requirements
- offline/reconnect acceptance requirements
- API failure acceptance requirements
- mobile farmer acceptance requirements
- single CI production gate

Important:
A ZIP cannot prove live Supabase/Vercel behavior. The included acceptance suite
intentionally refuses to claim a real-time pass without real Supabase credentials.

After deployment:
1. Apply the realtime SQL migration to the real Supabase project.
2. Verify RLS for every subscribed table.
3. Test the same account on two devices.
4. Test two different accounts for isolation.
5. Test offline -> reconnect -> sync.
6. Test real email verification.
7. Test Gemini/OpenWeather failure states.
8. Test the Android farmer journey.

Only after those pass should the product be described as fully real-time in production.
