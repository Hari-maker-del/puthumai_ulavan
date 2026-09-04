# Puthumai Uzhavan — Final Change Audit

## Completed in this release

1. **Farm ownership**
   - Application/database contract is `farms.user_id`.
   - Realtime farm filter is `user_id=eq.<authenticated-user>`.
   - Legacy `owner_id` is only retained as an application compatibility alias and is never used as a Supabase farm filter.

2. **Farmer → farms → fields hierarchy**
   - A farmer can own many farms.
   - Each field belongs to exactly one `farm_id`.
   - Field ownership is synchronized from the parent farm and protected by RLS.
   - Fields are included in realtime subscriptions.

3. **Realtime**
   - Farmer tables use user-scoped filters.
   - `fields` is included alongside farms, crops, expenses, alerts and recommendations.
   - Existing reconnect/status handling is preserved.

4. **Dashboard real data**
   - KPI values come from authenticated farm records.
   - Weather uses the farmer's farm/profile location and live Open-Meteo data.
   - Crop-health summary uses stored crop health/farm health values.
   - Expenses use authenticated expense records.
   - Static dashboard demo cards and demo marketplace preview were removed from the dashboard home.
   - Empty live data is shown as empty/unavailable instead of sample farmer values.

5. **AI crop recommendation**
   - Removed the previous hard-coded recommendation scoring/fallback path.
   - Recommendations now use the configured Gemini model with supplied farm records, live weather and verified market records.
   - Current market price/profit is never fabricated when verified market data is unavailable.

6. **Crop scanner**
   - Existing scanner already used Gemini image analysis and had no mock fallback; it remains real-data-only.
   - Scan history is read from `crop_scans`; no bundled demo scan history is displayed.

7. **Yield prediction**
   - Removed the dependency on an external `/api/yield` backend that was absent from this Vercel package.
   - Yield prediction now uses the configured Gemini model with the farmer's farms, fields, crop records, previous saved predictions and weather.
   - Results are persisted to `yield_predictions`.

8. **Analytics and season reporting**
   - Removed hard-coded revenue/cost/yield summaries.
   - Reports now use recorded `farm_sales`, `expenses` and saved `yield_predictions` only.

9. **Database migrations**
   - Added `000_base_farmer_schema.sql` for the core Supabase tables and owner-only RLS policies.
   - Added `yield_predictions` schema.
   - Added compatibility handling for legacy `farms.owner_id` databases.
   - Added `state` support to market prices.
   - Added `fields` to realtime publication setup.

## Verification performed in this environment

- TypeScript: **PASS** (`npm run typecheck`)
- Real-data static audit: **PASS** (`npm run real-data:audit`)
- Core farm requirements audit: **PASS** (`npm run core:farm:audit`)
- RLS static audit: **PASS** (`npm run rls:static-audit`)

## Still required on the target Windows/Vercel environment

- `npm ci`
- `npm run lint`
- `npm run build`
- Apply all Supabase migrations to the real project.
- Set real Supabase/Gemini/data.gov.in environment variables.
- Verify the deployed Vercel URL after redeployment.

## Important model note

The crop and yield modules now call the configured **Gemini AI model** rather than pretending to use a local trained agriculture model. This is a real ML/AI inference path, but it is **not a custom TensorFlow/scikit-learn model trained on an agricultural dataset**. A custom trained agriculture model would require a validated training dataset and a separate training/deployment pipeline.
