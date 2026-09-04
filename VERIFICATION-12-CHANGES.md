# Puthumai Uzhavan — Verification of the 12 Requested Changes

This audit checks the current source package. It distinguishes source-level evidence from items that require a live Supabase/backend/browser test.

## 1. Login/session persistence — PASS (source level)
Supabase is configured with `persistSession: true`, `autoRefreshToken: true`, and localStorage storage. AuthContext restores the session with `getSession()` before protected routes are evaluated.

## 2. Indian-language selection — PARTIAL
The registry contains 23 choices: English plus 22 scheduled Indian languages. Urdu is marked RTL and the app normalizes several Indian/Arabic numeral ranges to English 0–9.
However, the source does **not** prove that every visible string on every feature page is translated into every language. Several pages still contain hard-coded English copy. This must not be presented as “100% full-web translation.”

## 3. Language in Settings — PASS (source level)
Settings contains the same language registry and persists the selected language to the profile and local storage.

## 4. AI technical-error protection — PASS (source level)
AI assistant and daily plan convert provider failures to farmer-friendly messages. The daily plan also rejects raw provider-error strings before rendering them.

## 5. AI unified interface/language — PARTIAL
The AI page is a single page and uses the selected language copy plus selected locale for voice/TTS. Some accessibility labels and small status strings remain hard-coded English, so complete multilingual coverage is not yet proven.

## 6. Today's Farm Plan fallback — PASS (source level)
A failed AI generation leaves the Safe Daily Checklist available and displays a non-technical fallback message.

## 7. Government Scheme personalization — PASS (source level)
AI recommendation generation is blocked until profile completeness reaches 100%; recommendations are constrained to the static catalog and raw AI formatting is cleaned.
Live eligibility/links still require current-source verification and backend testing.

## 8. Yield tab crash protection — PASS (source level)
The page treats `fields` and `trend` as arrays only when valid, and handles API errors with an empty/error state rather than dereferencing missing properties.

## 9. Offline Mode — PARTIAL
Offline GET caching and Supabase REST mutation queuing are implemented through `offlineAwareFetch`; an online event triggers queue replay. Actual offline/online behavior still requires browser + real Supabase acceptance testing.

## 10. Dark Mode — PASS (source level)
ThemeContext persists the setting, applies the `dark` root class and color scheme, and main.tsx restores the theme before first render.
The visual correctness of every component still needs a browser test because Tailwind/CSS classes determine whether each component actually has dark variants.

## 11. Farmer-friendly errors — PARTIAL
The reviewed AI/yield/settings paths avoid exposing raw provider/database details. A whole-app static audit still finds legacy/hard-coded strings and some generic/raw error paths in other services, so this is not proven globally.

## 12. Farmer Memory / personalization — PASS (source level) + DB migration fix
Farmer Memory is stored per authenticated user and RLS policies restrict access by `auth.uid() = user_id`.
The previous schema-refresh migration contained invalid PostgreSQL syntax (`CREATE POLICY IF NOT EXISTS`). It has been corrected to use `pg_policies` checks inside a `DO` block.

## Live tests still required
1. Sign up with a new account.
2. Close/reopen browser/app and confirm session restoration.
3. Complete Visitor onboarding and confirm it is not repeated.
4. Complete Farmer onboarding and confirm it is not repeated.
5. Apply the Farmer Memory migration in the real Supabase project and test save/read.
6. Test two accounts to verify data isolation.
7. Test every supported language on representative pages.
8. Turn network off and test cached data + queued mutation + reconnection sync.
9. Toggle Dark Mode and inspect all major pages.
10. Test Gemini 503/429/network failures with the real AI configuration.
11. Test Yield with valid, empty, malformed and unavailable API responses.
12. Verify government-scheme links/eligibility against current official sources before demo/production.
