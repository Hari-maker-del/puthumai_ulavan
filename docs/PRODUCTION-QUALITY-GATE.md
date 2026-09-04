# Production Quality Gate

A release is accepted only when all gates pass.

## Gate A — Code
- TypeScript passes
- ESLint passes
- Vite production build passes
- no secrets or local build artifacts are committed

## Gate B — Security
- Supabase RLS enabled for every user-owned table
- cross-user read/write tests pass
- no service-role credentials in Vite environment
- authentication redirect URLs restricted to intended domains

## Gate C — Data trust
Every external value carries provenance:
LIVE / CACHED / ESTIMATE / DEMO / UNAVAILABLE.

AI output must not upgrade low-trust evidence into a high-trust claim.

## Gate D — AI safety
Every decision has:
- recommendation
- reasons
- evidence
- confidence
- risk
- verification requirement

High-risk decisions require verification guidance.

## Gate E — Reliability
- external API retries use bounded backoff
- offline writes are idempotent
- conflicts are detected
- API failure degrades gracefully

## Gate F — User experience
- mobile layouts pass
- keyboard navigation is usable
- important actions have accessible labels
- empty/loading/error states are understandable

## Gate G — Deployment
- production environment variables configured
- Vercel deployment is Ready
- runtime logs show no recurring errors
- complete farmer journey succeeds
