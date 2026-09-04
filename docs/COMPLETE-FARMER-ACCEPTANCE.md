# Complete Real-Farmer Acceptance

## 1. New farmer
- [ ] New signup succeeds.
- [ ] Real verification email arrives.
- [ ] Verification callback succeeds.
- [ ] New farmer sees an empty-state onboarding, not another farmer's data.
- [ ] Profile can be completed.
- [ ] First farm can be created.
- [ ] First crop can be created.
- [ ] First expense can be created.

## 2. Data ownership
- [ ] Every farmer query is scoped to the authenticated owner.
- [ ] RLS is enabled.
- [ ] Farmer A cannot read B.
- [ ] Farmer A cannot insert/update/delete as B.
- [ ] Realtime events cannot cross tenants.

## 3. Realtime
- [ ] Farm INSERT/UPDATE/DELETE propagates.
- [ ] Crop INSERT/UPDATE/DELETE propagates.
- [ ] Expense INSERT/UPDATE/DELETE propagates.
- [ ] Alert changes propagate.
- [ ] Recommendation changes propagate.
- [ ] Status shows Live/Connecting/Reconnecting/Offline.
- [ ] Reconnection resubscribes automatically.

## 4. Offline
- [ ] Offline indicator appears.
- [ ] Supported offline operations are queued.
- [ ] Same idempotency key is not duplicated.
- [ ] Reconnect triggers sync.
- [ ] Failed operation remains queued.
- [ ] Authoritative server state is restored after sync.

## 5. APIs
- [ ] Weather is live when configured.
- [ ] Weather stale/cached state is visible.
- [ ] Gemini errors are handled.
- [ ] 401/403/429/5xx are handled.
- [ ] No external API failure creates a white screen.
- [ ] Demo data is never labelled LIVE.

## 6. Mobile farmer journey
- [ ] Android login/signup.
- [ ] Email verification.
- [ ] Camera permissions and denial fallback.
- [ ] Voice permissions and denial fallback.
- [ ] Forms usable one-handed.
- [ ] Tamil and English text fit.
- [ ] Charts remain usable.
- [ ] Offline/reconnect tested.

## 7. Production
- [ ] Vercel deployment is Ready.
- [ ] Production variables are configured.
- [ ] Supabase callback URL is correct.
- [ ] Realtime migration is applied.
- [ ] RLS is reviewed in production.
- [ ] Runtime logs show no recurring errors.

A product is only declared "real-farmer production ready" after all boxes above have evidence from the real deployed environment.
