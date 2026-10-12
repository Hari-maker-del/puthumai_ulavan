# Puthumai Ulavan — 61-page website implementation checklist

This checklist distinguishes real application pages from informational/support pages. Informational pages must not imply that unavailable workflows, live monitoring, payments, or third-party integrations are already active.

## Public and discovery pages
1. Home — `/` — implemented landing page
2. About — `/about` — implemented
3. Features — `/features` — implemented
4. Services — `/services` — implemented
5. Pricing — `/pricing` — informational; no payment flow
6. How it works — `/how-it-works` — added
7. For farmers — `/for-farmers` — added
8. Contact — `/contact` — support information
9. FAQ — `/faq` — implemented
10. Help center — `/help` — implemented
11. Farmer resources — `/farmer-resources` — added
12. Farming blog/resources — `/blog` — informational resource index
13. Farmer community — `/community` — informational; community posting not enabled
14. Farmer stories — `/success-stories` — consent/evidence placeholder, no fabricated testimonials
15. App/mobile access — `/app-download` — responsive web guidance

## Farm knowledge pages
16. Crop planning — `/crop-planning` — added
17. Crop calendar — `/crop-calendar` — added
18. Soil health guide — `/soil-health-guide` — added
19. Water management — `/water-management` — added
20. Pest management — `/pest-management` — added
21. Weather guidance — `/weather-guidance` — added
22. Yield estimates guide — `/yield-estimates` — added
23. Expense guidance — `/expense-guidance` — added
24. Farm records guide — `/farm-records` — added
25. Market prices — `/market-prices` — added
26. Government schemes — `/government-schemes` — added
27. Responsible use guidelines — `/service-guidelines` — added

## Account and authentication pages
28. Login — `/login` — implemented
29. Sign up — `/signup` — implemented
30. Forgot password — `/forgot-password` — implemented
31. Reset password — `/reset-password` — implemented
32. Email verification — `/verify-email` — implemented
33. Auth callback — `/auth/callback` — implemented
34. Role onboarding — `/onboarding/role` — implemented
35. Farm onboarding — `/onboarding/farm` — implemented
36. Profile — `/dashboard/profile` — implemented
37. Farm profile — `/dashboard/farm-profile` — implemented
38. Settings — `/dashboard/settings` — implemented
39. Security guidance — `/security` — added

## Farmer workspace pages
40. Dashboard — `/dashboard` — implemented
41. Crop recommendations — `/dashboard/crops` — implemented
42. Crop lifecycle — `/dashboard/crop-lifecycle` — implemented
43. Daily farm plan — `/dashboard/daily-plan` — implemented
44. Weather — `/dashboard/weather` — implemented
45. Crop health — `/dashboard/crop-health` — implemented
46. Farm health — `/dashboard/farm-health` — implemented
47. Yield prediction — `/dashboard/yield-prediction` — implemented
48. Expense tracker — `/dashboard/expenses` — implemented
49. Analytics — `/dashboard/analytics` — implemented
50. Season report — `/dashboard/season-report` — implemented
51. Farm report — `/dashboard/farm-report` — implemented
52. AI assistant — `/dashboard/chatbot` — implemented
53. Market intelligence — `/dashboard/market-intelligence` — implemented
54. Marketplace — `/dashboard/marketplace` — implemented
55. Government schemes directory — `/dashboard/schemes` — implemented
56. Alerts — `/dashboard/alerts` — implemented
57. Notifications — `/dashboard/notifications` — implemented
58. Offline mode — `/dashboard/offline` — implemented
59. Admin panel — `/dashboard/admin` — implemented

## Legal, privacy, and recovery pages
60. Privacy and data rights — `/privacy`, `/data-consent`, `/how-we-use-data`, `/data-export`, `/data-correction`, `/delete-account` — informational/request guidance; align with production data practices
61. Terms, accessibility, feedback and recovery — `/terms`, `/cookies`, `/accessibility`, `/accessibility-help`, `/feedback`, `/report-issue`, `/system-status`, `/maintenance`, `/offline`, `/network-error`, `/session-expired`, `/link-expired`, `/400`, `/401`, `/403`, `/404`, `/408`, `/429`, `/500`, `/502`, `/503`, `/504` — implemented/added as shared, route-specific experiences

## Quality and release notes
- Preserve existing authenticated dashboard routes and protected-route behavior.
- Keep claims honest: the status page is not live monitoring, support/contact pages do not pretend to submit a ticket, and informational data-rights pages do not claim to delete/export data automatically.
- Before production launch, review Privacy, Terms, Cookie and data-rights content against actual Supabase, hosting, analytics and AI-provider practices.
- Verify with `npm run typecheck`, `npm run lint`, and `npm run build`; then manually test every route at desktop and mobile widths, including unauthenticated access to protected routes.
