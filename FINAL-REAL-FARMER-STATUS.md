# Puthumai Uzhavan — Final Real Farmer Candidate

This release integrates the ten production steps:
1. New-farmer onboarding contract.
2. User ownership checks.
3. Realtime registry/status.
4. Offline idempotent queue primitive.
5. External API failure classification.
6. Role authorization contract.
7. Realtime status across farmer data.
8. RLS/realtime database gates.
9. Vercel/Supabase deployment checklist.
10. Automated static production gate.

Important: live verification cannot be simulated. Before giving this to real
farmers, apply the Supabase migrations and complete:
- new signup + real email verification
- two-device realtime test
- two-user RLS isolation
- offline/reconnect test
- real API failure tests
- Android farmer journey
