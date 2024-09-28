-- Drop the existing policy
DROP POLICY IF EXISTS "All authenticated users can create organizations" ON "public"."organizations";

-- Recreate the policy without the maintenance mode check
CREATE POLICY "All authenticated users can create organizations" ON "public"."organizations" FOR
INSERT TO "authenticated";


-- Drop the existing policy
DROP POLICY IF EXISTS "All organization members can update organizations" ON "public"."organizations";

-- Recreate the policy without the maintenance mode condition
CREATE POLICY "All organization members can update organizations" ON "public"."organizations" FOR
UPDATE TO "authenticated" USING (
    "auth"."uid"() IN (
      SELECT "public"."get_organization_member_ids"("organizations"."id")
    )
  );


  -- Drop the existing policy
DROP POLICY IF EXISTS "Only organization admins can invite other users" ON "public"."organization_join_invitations";

-- Recreate the policy without the maintenance mode condition
CREATE POLICY "Only organization admins can invite other users" ON "public"."organization_join_invitations" FOR
INSERT TO "authenticated" WITH CHECK (
    "auth"."uid"() IN (
      SELECT "public"."get_organization_admin_ids"(
          "organization_join_invitations"."organization_id"
        )
    )
  );


  -- Drop the existing policy
DROP POLICY IF EXISTS "Only organization admins/owners can delete organizations" ON "public"."organizations";

-- Recreate the policy without the maintenance mode condition
CREATE POLICY "Only organization admins/owners can delete organizations" ON "public"."organizations" FOR DELETE TO "authenticated" USING (
  "auth"."uid"() IN (
    SELECT "public"."get_organization_admin_ids"("organizations"."id")
  )
);


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