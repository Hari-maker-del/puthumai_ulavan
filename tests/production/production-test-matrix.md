# Production Test Matrix

## Automated/static gates
- [x] Required authentication files exist
- [x] Production architecture files exist
- [x] Release contains no .env files
- [x] Release contains no node_modules/dist/.git
- [x] Package name and core scripts verified
- [x] Source secret-pattern scan
- [x] Data provenance contract
- [x] Explainable AI contract
- [x] Digital Twin contract
- [x] Outcome feedback contract
- [x] Offline conflict contract
- [x] Retry/resilience contract

## Real Supabase gates
- [ ] User A cannot SELECT User B farm
- [ ] User A cannot INSERT a record owned by User B
- [ ] User A cannot UPDATE User B record
- [ ] User A cannot DELETE User B record
- [ ] New signup requires confirmation
- [ ] Verification email redirects to production callback
- [ ] Verified session reaches dashboard
- [ ] Expired link shows recovery UI
- [ ] Reset-password remains independent

## Real API gates
- [ ] Gemini valid key
- [ ] Gemini 401
- [ ] Gemini 429
- [ ] Gemini timeout/offline
- [ ] Weather valid key
- [ ] Weather 401/404
- [ ] Weather timeout/offline
- [ ] Market live/cached/estimate/demo labels
- [ ] Government scheme source/availability label

## Real Vercel gates
- [ ] All required environment variables configured
- [ ] Production deployment Ready
- [ ] Runtime logs clean
- [ ] No recurring client exceptions
- [ ] Production callback URL configured in Supabase

## Real Android gates
- [ ] 320px/360px/412px layouts
- [ ] Camera permission denied fallback
- [ ] Microphone permission denied fallback
- [ ] Touch targets usable
- [ ] Keyboard navigation/focus where applicable
- [ ] Tamil + English text does not overflow
- [ ] Offline create/update
- [ ] Reconnect sync
- [ ] Duplicate prevention
