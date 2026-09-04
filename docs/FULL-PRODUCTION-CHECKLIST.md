# Full Production Checklist
1. Mock/demo audit: production must never silently use mock data.
2. TypeScript/build: run npm run quality:final.
3. Auth: real signup, email verification, callback, login, reset.
4. Supabase/RLS: two accounts; no cross-user data.
5. Realtime: farm/crop/expense/alert/recommendation create/update/delete on two devices.
6. APIs: Gemini/weather/backend; missing keys and 401/429/5xx fail visibly.
7. Mobile: 320- desktop, Android keyboard/camera/touch.
8. Runtime: error boundary and network failure states.
9. New farmer: empty account contains no sample farmer records.
10. No localhost/fake fallbacks in production.
11. Remove unused demo modules only after import audit.
12. Vercel Preview first; production only after live acceptance.
