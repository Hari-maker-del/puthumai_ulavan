-- Real-farmer security gate.
-- APPLY AND REVIEW AGAINST THE ACTUAL SCHEMA BEFORE PRODUCTION.
-- This intentionally fails closed for the requirement: user-owned tables must have RLS.
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','farms','crops','expenses','farmer_alerts','recommendations']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END IF;
  END LOOP;
END $$;

-- IMPORTANT:
-- Existing project-specific policies must be reviewed for owner columns.
-- Do not create permissive "authenticated users can do everything" policies.
-- Verify SELECT/INSERT/UPDATE/DELETE for two different real users before release.
