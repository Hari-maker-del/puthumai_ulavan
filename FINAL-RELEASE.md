# Puthumai Uzhavan — Final Production Candidate

This archive is feature-frozen. The focus is production reliability rather than adding more UI.

## Included
- AI Farm Intelligence
- Farmer Memory
- Crop lifecycle engine
- Smart alerts
- Explainable AI/evidence layer
- Offline sync foundation
- Data provenance model
- Production environment validation
- Farm data integrity validation
- Client health checks
- Security and architecture documentation
- GitHub production CI
- Production checklist
- Deterministic release audit script

## Verification
From the project root:

```powershell
node scripts/production-audit.mjs
npm ci
npm run typecheck
npm run lint
npm run build
```

The release audit is structural only. TypeScript, ESLint, and Vite still need to be executed in the target Node environment.

## Before deployment
1. Configure Vercel environment variables.
2. Verify Supabase RLS with two separate users.
3. Configure Supabase Auth redirect URLs.
4. Test the complete farmer journey.
5. Check Vercel runtime logs after deployment.
6. Tag the verified Git commit as the production release.
