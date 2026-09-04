# Live Acceptance Test

Static build checks cannot prove live Supabase/Vercel behavior.

Required staging tests:
1. New farmer signup.
2. Email verification callback.
3. Login/session restore/logout.
4. New farmer has no demo farm/crop/expense/analytics records.
5. Create farm, crop and expense; reload and confirm persistence.
6. Farmer A cannot read/update/delete Farmer B's records.
7. Realtime insert/update/delete reaches the correct farmer session only.
8. Reconnect after network interruption.
9. Gemini/weather/API failure shows an honest error/empty state, never fake data.
10. Vercel Preview with real environment variables.
11. Android Chrome/mobile camera/forms/navigation.
12. Production smoke test after promotion.
