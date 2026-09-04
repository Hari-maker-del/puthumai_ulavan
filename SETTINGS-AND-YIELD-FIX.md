# Puthumai Uzhavan — Settings & Yield Stability Fix

## Fixed
- Added a global ThemeProvider so the Settings dark-mode switch controls the whole authenticated application, not only the Settings component.
- Dark-mode preference is restored before the first React render and persisted in localStorage.
- Added `color-scheme` and mobile browser theme-color handling.
- Expanded dark-theme styling for the shared dashboard shell, cards, forms, tables, and common status surfaces.
- Kept the existing language persistence flow unchanged.
- Hardened the Yield Prediction page against partial/malformed backend responses: missing `fields` or `trend` arrays no longer crash the route and trigger the generic error screen.

## Verification note
The project source was statically inspected after the changes. A full Vite/TypeScript build could not be completed in this environment because `npm install` timed out before dependencies were installed.
