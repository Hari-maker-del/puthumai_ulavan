# Real-Data-Only Production Candidate

This release removes silent mock fallbacks from production services and prevents
mock mode from being enabled in production builds.

It also removes the hardcoded dashboard season summary and neutralizes the
legacy demo-data compatibility module so it cannot present the previous sample
farmer records as live data.

The included audit checks for localhost fallback and common mock-return paths.

Live Supabase/Vercel/API/mobile testing is still required for certification.
