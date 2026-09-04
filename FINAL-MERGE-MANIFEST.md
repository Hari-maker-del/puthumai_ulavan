# Puthumai Uzhavan — Final Merge Manifest

Base: Puthumai-Uzhavan-FINAL-LOCAL-FIXED(2)
Merged additive production assets from: puthumai_ulavan-main (8)(1)

Important:
- The FINAL-LOCAL-FIXED(2) versions of src/main.tsx, DashboardHome.tsx, and
  20260825_farm_operations_rls.sql are retained because they are newer/correct
  relative to the FARM-OPERATIONS-PRODUCTION-FINAL archive.
- In particular, src/main.tsx uses ErrorBoundary, not the broken AppErrorBoundary.
- No obsolete AppErrorBoundary wrapper was copied from the older archive.
- package.json scripts were unioned without replacing the newer farm-operation
  quality pipeline.
- This archive is a candidate for local verification; it is not a claim of
  live deployment verification.
