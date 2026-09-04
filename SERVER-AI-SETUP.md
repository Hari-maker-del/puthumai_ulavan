# Server-side Gemini setup

The Gemini secret is no longer exposed through `VITE_*` browser variables.

Configure these variables in Vercel (Production/Preview as needed):

- `GEMINI_API_KEY` — private Google Gemini API key
- `GEMINI_MODEL` — optional, defaults to `gemini-2.5-flash`
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anon/public key used only to validate the signed-in user's access token

Keep `GEMINI_API_KEY` out of `.env` files committed to Git and never prefix it with `VITE_`.

The browser calls `/api/gemini` with the current Supabase access token. The Vercel function validates the user, applies a basic per-user/IP rate limit, and then calls Gemini with the server-side secret.
