# Puthumai Uzhavan — Complete Real-Farmer Candidate

This release consolidates the requested production work into one codebase:
- New farmer onboarding
- User ownership and RLS gates
- Realtime farms/crops/expenses/alerts/recommendations
- Realtime reconnect and health
- Offline queue with idempotency
- Sync coordinator
- External API failure classification
- Provenance labels
- Authorization helpers
- Farmer notification model
- Resilient fetch
- Mobile/field acceptance
- Complete production audit
- Single CI build gate

No file-only build can prove live Supabase, email, Vercel, external API, or
physical-device behavior. The included acceptance document is the final
real-environment proof required before production farmer rollout.
