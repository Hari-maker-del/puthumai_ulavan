-- Explicit RLS policies for the core farm-operation tables.
-- Table/column names match 20260825_core_farm_operations.sql.
DO $$
BEGIN
 IF to_regclass('public.farm_tasks') IS NOT NULL THEN
  ALTER TABLE public.farm_tasks ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_tasks_owner ON public.farm_tasks;
  CREATE POLICY farm_tasks_owner ON public.farm_tasks
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_inventory') IS NOT NULL THEN
  ALTER TABLE public.farm_inventory ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_inventory_owner ON public.farm_inventory;
  CREATE POLICY farm_inventory_owner ON public.farm_inventory
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.irrigation_schedules') IS NOT NULL THEN
  ALTER TABLE public.irrigation_schedules ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS irrigation_schedules_owner ON public.irrigation_schedules;
  CREATE POLICY irrigation_schedules_owner ON public.irrigation_schedules
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_equipment') IS NOT NULL THEN
  ALTER TABLE public.farm_equipment ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_equipment_owner ON public.farm_equipment;
  CREATE POLICY farm_equipment_owner ON public.farm_equipment
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.farm_sales') IS NOT NULL THEN
  ALTER TABLE public.farm_sales ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS farm_sales_owner ON public.farm_sales;
  CREATE POLICY farm_sales_owner ON public.farm_sales
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.soil_tests') IS NOT NULL THEN
  ALTER TABLE public.soil_tests ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS soil_tests_owner ON public.soil_tests;
  CREATE POLICY soil_tests_owner ON public.soil_tests
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
 END IF;

 IF to_regclass('public.community_posts') IS NOT NULL THEN
  ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
  DROP POLICY IF EXISTS community_posts_owner ON public.community_posts;
  CREATE POLICY community_posts_owner ON public.community_posts
    FOR ALL USING (author_id = auth.uid()) WITH CHECK (author_id = auth.uid());
 END IF;
END $$;
