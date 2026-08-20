-- Puthumai Uzhavan realtime publication.
-- Apply to the REAL Supabase project using the Supabase SQL editor/migrations.
-- RLS remains mandatory; Realtime must not expose rows a user cannot read.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['farms','expenses','crops','farmer_alerts','recommendations']
  LOOP
    IF EXISTS (SELECT 1 FROM pg_class WHERE relname = tbl AND relkind = 'r') THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      EXCEPTION WHEN duplicate_object THEN
        NULL;
      END;
    END IF;
  END LOOP;
END $$;

-- Recommended production setting: Realtime should respect RLS.
-- Confirm this in the live Supabase project's Realtime settings before launch.
