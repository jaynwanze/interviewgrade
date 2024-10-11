-- Drop the existing policy
DROP POLICY IF EXISTS "Only the own user can update it" ON "public"."user_profiles";

-- Recreate the policy without the maintenance mode condition
CREATE POLICY "Only the own user can update it" ON "public"."user_profiles" FOR
UPDATE TO "authenticated" USING ("auth"."uid"() = "id");


DROP FUNCTION IF EXISTS public.is_app_not_in_maintenance_mode;

DROP FUNCTION IF EXISTS public.is_app_in_maintenance_mode;

DROP FUNCTION IF EXISTS public.disable_maintenance_mode;

DROP FUNCTION IF EXISTS public.enable_maintenance_mode;

DROP TABLE IF EXISTS app_settings;

-- drop enum maintenance_status
DROP TYPE IF EXISTS maintenance_status;