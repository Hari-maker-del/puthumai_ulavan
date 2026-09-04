# React hooks warning review

The remaining exhaustive-deps diagnostics were reviewed rather than globally disabled.

Rule:
- Effects that truly depend on changing values must include those dependencies or use a stable useCallback/useMemo.
- Effects that intentionally initialize browser subscriptions/listeners once may retain [] with a targeted, explained eslint decision.
- No blanket `react-hooks/exhaustive-deps` disable is permitted.
- After dependency installation, run `npm run lint` and require zero warnings/errors before release.
