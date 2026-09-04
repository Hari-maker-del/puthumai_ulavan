# Puthumai Uzhavan – AI & Multilingual UI Update

- AI Assistant is now a single unified interface; the duplicated page/header treatment was removed.
- AI Assistant follows the global language selected on Login or Settings.
- AI speech input/output uses the selected language locale where browser support exists.
- Farmer-facing AI failures are sanitized; Gemini JSON, HTTP status codes, model names, API keys, and provider details are not rendered.
- A localized safe fallback remains available with retry.
- Suggested questions are localized across the scheduled Indian-language set.
- Settings continues to expose the shared 22-language + English selector.
- Added `20260830_farmer_memory_schema_refresh.sql` to ensure `public.farmer_memory` exists and request PostgREST schema refresh.

## Verification note
The dependency installation/build could not be completed in this environment because `npm install` exceeded the execution timeout. Source changes were inspected, but no false claim of a production build is made.
