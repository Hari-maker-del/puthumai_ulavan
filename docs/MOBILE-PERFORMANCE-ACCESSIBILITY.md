# Mobile, Performance & Accessibility Gate

## Mobile
Test on a real Android phone at:
- 320px
- 360px
- 412px
- portrait and landscape where relevant

Verify AI chat, camera, voice, forms, charts, alerts and offline sync.

## Accessibility
- All icon-only buttons have accessible names.
- Form controls have labels.
- Focus is visible.
- Modal/dialog focus is managed.
- Errors are announced or clearly associated with fields.
- Touch targets are comfortable on mobile.
- Color is never the only signal.

## Performance
- Heavy chart/analytics routes should remain lazy-loaded.
- Images should be appropriately sized.
- Initial route should not load unnecessary admin/analytics code.
- Test production build on a slower mobile connection.
