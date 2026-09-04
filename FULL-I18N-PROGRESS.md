# Puthumai Uzhavan — Full i18n continuation

This update continues the multilingual implementation.

## Included
- 22 scheduled Indian languages plus English remain available in the language selector.
- Selected language persists in local storage and Supabase user metadata.
- Urdu uses RTL document direction.
- English numerals (0-9) are normalized in rendered text.
- Translation runtime now remembers the original English source text for rendered nodes and translatable accessibility attributes, so switching languages can move between supported translations without getting stuck on a previous language.
- Fixed the missing `I18nProvider` closing tag in `src/App.tsx` found during validation.

## Important limitation
The project still contains feature-specific hard-coded copy. The centralized catalog translates the strings currently covered by it; uncovered feature-specific sentences require reviewed translations for each language. This file does not claim those strings are fully translated.
