# Puthumai Uzhavan Production Release Checklist

## Local
- [ ] `npm install`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Test authentication
- [ ] Test farmer/farm CRUD
- [ ] Test AI success, missing-key, 401, quota, and network states
- [ ] Test weather success, 401, 404, missing key, and network states
- [ ] Test market records, empty records, and profit scenarios
- [ ] Test offline mode and queued actions
- [ ] Test mobile layouts

## Supabase
- [ ] Apply all migrations
- [ ] Enable RLS on every user-owned table
- [ ] Verify SELECT/INSERT/UPDATE/DELETE ownership policies
- [ ] Test User A cannot read User B's records
- [ ] Confirm no service-role key is in frontend variables
- [ ] Verify Auth redirect URLs for production domain

## Vercel
- [ ] Add production environment variables
- [ ] Redeploy after env changes
- [ ] Open production URL in an incognito window
- [ ] Test login/register/reset
- [ ] Test AI
- [ ] Test weather
- [ ] Test market
- [ ] Test crop health
- [ ] Test reports
- [ ] Check runtime logs

## Data integrity
- [ ] Every live value has a source/status
- [ ] Demo data is visibly labelled
- [ ] AI never presents estimates as verified live values
- [ ] High-impact agricultural recommendations include verification guidance

## Release
- [ ] No `.env` files in repository
- [ ] No secrets in source
- [ ] No `node_modules`, `dist`, or `.git` in source archive
- [ ] README and deployment docs updated
- [ ] Create a release tag after final verification
