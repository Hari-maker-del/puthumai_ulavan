# Error-Free & Responsive Acceptance

Automated gates:
- TypeScript
- ESLint
- Vite production build
- Static responsive/error audit

Required real-device viewport checks:
320, 360, 375, 390, 412, 768, 1024 and desktop.

Verify every farmer flow: landing, signup, verification, login, dashboard,
farm, crop recommendation, crop health/camera, AI assistant, expenses,
weather, yield prediction, analytics, profile and settings.

Responsive requirements:
- no horizontal page scroll
- no clipped controls
- 44px minimum interactive controls
- tables scroll inside their containers
- charts fit their containers
- mobile navigation remains usable
- Tamil and English do not overflow
- camera/voice controls remain tappable

Runtime resilience:
- component errors show recovery UI instead of a blank screen
- missing API keys show actionable states
- network failures do not white-screen the app
- expired sessions return to the correct auth state

A real Android test is required before releasing to farmers.
