# Puthumai Uzhavan — Final Quality Gate

## Build
Run `npm ci`, `npm run quality:check`, `npm run production:audit`, `npm run auth:check`, `npm run typecheck`, `npm run lint`, and `npm run build`.

## Authentication
- New signup requires email confirmation.
- Verification reaches `/auth/callback`.
- token_hash/signup, code, and implicit hash-session paths are handled.
- Invalid/expired links have safe recovery messages.
- Resend has cooldown.
- Verified users reach the dashboard.
- Logout/login and password reset work.
- Supabase Site URL/redirect URLs are correct.
- Password policy is enforced by Supabase Auth, not only React.

## RLS
Use two staging accounts A and B. A must not read, update, delete, or create records owned by B. Test farmer memory, conversations, alerts, market records, crops, expenses, and profiles. Admin authorization must be server/database enforced.

## Data trust
External values are labelled LIVE, CACHED, ESTIMATE, DEMO, or UNAVAILABLE. AI cannot turn low-trust evidence into verified facts.

## AI safety
Recommendations expose reasons/evidence/confidence/risk. High-risk guidance requires verification. Missing keys, quota errors and network failures degrade gracefully.

## Reliability
External calls use bounded retries. Offline writes are idempotent and conflicts are detected. Runtime failures are captured without storing secrets.

## Mobile/accessibility
Test 320, 375, 768, 1024 and 1440px widths; keyboard navigation; labels; focus states; touch targets; empty/loading/error states; camera/voice denial; Tamil/English overflow.

## Performance
Heavy chart/application pages remain lazy-loaded. Test a throttled mobile connection and inspect Vercel bundle output.

## Real integrations
Test valid/invalid OpenWeather and Gemini keys, Supabase production auth/RLS, and verified market/government sources. Never label empty/demo data as live.

## Deployment
Vercel production is Ready, environment variables are configured, runtime logs have no recurring errors, and the complete farmer journey succeeds.

## Honest boundary
Real email click-through, two-user RLS isolation, and third-party API calls require the real staging/production environment. They cannot be honestly simulated by a source archive.
