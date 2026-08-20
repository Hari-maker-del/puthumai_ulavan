# Puthumai Uzhavan Architecture

The production architecture is organized around a farm intelligence loop:

Farmer Profile → Farm Memory → Verified/derived farm context → AI Farm Brain → Recommendation/Alert → Farmer Action → Outcome/History → Analytics.

## Data provenance
All external data should be classified as:
- live
- cached
- estimate
- demo
- unavailable

AI prompts must not imply a higher data quality than the underlying source.

## Security boundary
Browser code may use public Supabase URL + anon key. Service-role credentials must never be shipped to the browser.

## Offline boundary
Offline actions are queued locally and should be synchronized only after connectivity returns. Synchronization must be idempotent to avoid duplicate writes.

## Safety boundary
AI is decision support. Pesticide/fertilizer treatment, financial decisions, medical-like crop claims, and government eligibility should be verified with authoritative sources or qualified experts.
