# Puthumai Uzhavan — Integrated Farm Intelligence

## Closed-loop model

Farmer → Farm Digital Twin → Verified Context → AI Recommendation → Farmer Action → Outcome → Farm History → Better Context.

The outcome layer records what the farmer did. It does **not** claim that the app autonomously retrains a machine-learning model. Future recommendations can use outcome history as additional context after it is stored and validated.

## Digital Twin

The twin is a deterministic snapshot of known farm state:
- crop
- stage
- planting date
- area
- soil
- irrigation
- weather status
- market status
- expenses

Completeness is measurable so the UI can distinguish a strong-context recommendation from a sparse-context recommendation.

## Conflict safety

Offline changes must not silently overwrite newer server state. Version/timestamp checks are provided as a foundation; server-side conflict policy remains authoritative.

## Production principle

Correctness > feature count. The application should degrade gracefully when APIs fail and must never convert demo/cached/estimated values into verified live facts.
