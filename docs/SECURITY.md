# Security Notes

1. Never commit `.env`, `.env.local`, service-role keys, private API tokens, or passwords.
2. Treat every `VITE_*` variable as public because Vite embeds it into browser code.
3. Use Supabase RLS for all user-owned records.
4. Test cross-user access with two separate authenticated users.
5. Keep privileged database operations server-side.
6. Do not rely on frontend route guards as the security boundary.
7. Validate and constrain farm data before writes.
8. Do not present AI-generated content as verified government, market, weather, or agricultural fact.
