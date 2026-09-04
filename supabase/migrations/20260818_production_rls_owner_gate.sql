DO $$
DECLARE t text;
BEGIN
FOREACH t IN ARRAY ARRAY['profiles','farms','crops','expenses','farmer_alerts','recommendations']
LOOP
IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename=t) THEN
EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
END IF;
END LOOP;
END $$;
-- Review existing policies: every farmer-owned SELECT/INSERT/UPDATE/DELETE policy must compare ownership with auth.uid().
-- Do not add permissive authenticated-user policies.
