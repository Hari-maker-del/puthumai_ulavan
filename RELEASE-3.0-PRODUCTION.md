# Puthumai Uzhavan 3.0 Production Release

This release is feature-frozen. The focus is reliability, security, data integrity, offline behavior, monitoring readiness, and deployment verification.

Before production:
1. Run npm install
2. Run npm run typecheck
3. Run npm run lint
4. Run npm run build
5. Apply Supabase migrations
6. Test RLS with two users
7. Configure Vercel environment variables
8. Run the end-to-end smoke test
9. Inspect Vercel runtime logs
10. Tag the verified commit as the production release

This source archive intentionally excludes local dependencies, build output, git metadata, and environment secrets.
