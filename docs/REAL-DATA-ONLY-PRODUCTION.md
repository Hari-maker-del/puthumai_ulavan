# REAL-DATA-ONLY Production Contract

Production rules:
- `VITE_USE_MOCK` is ignored in production builds.
- No service silently falls back to mock data.
- Missing backend configuration produces a visible configuration error.
- Gemini scanner errors are returned to the UI; no fake scan is generated.
- Dashboard/analytics screens must not present illustrative farmer numbers as live.
- Static UI options (soil types, water sources, navigation labels) are allowed.
- Marketing testimonials/illustrations are not farmer records and must be clearly presented as illustrative if retained.

Required production configuration:
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_API_URL (if backend services are used)
- GEMINI_API_KEY (Vercel server environment, if AI features are enabled)
- VITE_DATA_GOV_API_KEY (if weather is enabled)
- VITE_USE_MOCK must NOT be used as a production data source.

Acceptance:
1. New farmer signs up and verifies email.
2. No demo farm/expense/crop appears.
3. Farmer creates their first farm.
4. Dashboard updates from real records.
5. Realtime changes appear on a second session.
6. A second farmer cannot see the first farmer's records.
7. Gemini/weather failure shows an error or cached state, never fake data.
