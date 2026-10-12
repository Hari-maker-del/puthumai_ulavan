# Puthumai Ulavan page audit

## Audit scope

This audit checks route-to-content wiring, not whether every feature has been validated against a live production account. The application contains three different things that must not be conflated:

1. **Routes** — URLs declared in React Router.
2. **Page content** — page-specific copy/actions in `ProfessionalPage.tsx`, or dedicated React pages.
3. **Working workflows** — actions that successfully save, load, validate and recover real data.

A route existing does not prove that its full workflow is production-ready.

## Changes in this branch

- Unknown URLs render the dedicated `NotFoundPage` instead of silently showing generic informational content.
- Adds `/pages`, a public page directory linked from the landing-page navigation and footer, so visitors can discover all informational/recovery routes and farmer tools in one place.
- Adds the missing Farm Outcomes entry to the authenticated farmer sidebar.
- The error boundary no longer promises that user data is safe after a crash; it warns that unsaved changes may be lost and links home.
- A repeatable `pages:audit` check verifies that each route rendered by `ProfessionalPage` has a matching page configuration and that all ten HTTP error destinations are registered.

## Required HTTP/system recovery pages

| Route | Purpose | Status in code |
|---|---|---|
| `/400` | Invalid request | Configured page content |
| `/401` | Sign-in required | Configured page content |
| `/403` | Access denied | Configured page content |
| `/404` | Not found | Configured plus dedicated catch-all page |
| `/408` | Request timeout | Configured page content |
| `/429` | Rate limit | Configured page content |
| `/500` | Internal error | Configured page content |
| `/502` | Bad gateway | Configured page content |
| `/503` | Service unavailable | Configured page content |
| `/504` | Gateway timeout | Configured page content |
| `/offline` | Offline information | Configured page content |
| `/network-error` | Network recovery | Configured page content |
| `/session-expired` | Re-authentication | Configured page content |
| `/link-expired` | Expired link recovery | Configured page content |
| `/maintenance` | Maintenance notice | Configured page content |
| `/system-status` | Status information | Configured, but not live monitoring |

## Important limitations to close before claiming all 63 pages are complete

- Several pages are informational guidance pages, not interactive forms or self-service workflows. For example, data export, account deletion, feedback, unsubscribe and issue reporting currently explain the support path rather than completing the action themselves.
- System-status content explicitly does not have live monitoring connected.
- The page directory is navigation, not proof of interactive behavior; several entries remain informational or support-assisted.
- A page-level smoke check does not prove Supabase authorization, form submission, AI provider availability, offline synchronization or mobile screen-reader behavior.
- HTTP routes such as `/500` are friendly destinations inside the SPA; they do not automatically make the hosting platform return the corresponding HTTP status code.
- Do not describe pages as complete until the relevant action, loading state, empty state, validation, success state, failure state and accessibility behavior have been tested.

## Verification

Run:

```sh
npm run pages:audit
npm run typecheck
npm run lint
npm run build
```

The route audit is intentionally static and does not require production secrets or network access.
