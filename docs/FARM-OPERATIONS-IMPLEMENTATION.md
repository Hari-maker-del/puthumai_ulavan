# Farm Operations implementation map

## Operations
- Field mapping/layout: field record contract exists; map UI requires a map provider and live location data.
- Crop cycle tracker: existing crop lifecycle + new stage contract.
- Task scheduler/calendar: task data contract + overdue calculation.
- Yield tracking: existing yield system + transparent estimate validation.

## Resources
- Inventory: real database contract; no demo inventory.
- Irrigation: real schedule/water tracking contract.
- Equipment: maintenance/fuel/service contract.

## Market & Finance
- Real-time price feed: use the existing live-market integration; no invented price fallback.
- Sales logbook: real sale record contract.
- Cost analysis: existing expense analytics + sale revenue calculation.

## Advisory
- Weather: use the hardened live weather system.
- Pest/disease alerts: existing alerts architecture; live source still required for factual alerts.
- Soil testing: soil test record contract and validation.

## Community
- Knowledge base: source URL + updated timestamp are mandatory.
- Community: user-owned post contract; moderation/live UI remains a deployment feature to verify.

## Production rule
A contract/service is not the same as a completed live UI. Any module without a connected production route, database table, RLS policy, and real source must display an honest unavailable/setup state rather than fake records.
