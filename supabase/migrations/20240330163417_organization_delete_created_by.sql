-- Migration to delete the 'created_by' column from the 'organizations' table
ALTER TABLE "public"."organizations" DROP CONSTRAINT "organizations_created_by_fkey";

-- We need to drop the policies that refer to the 'created_by' column
DROP POLICY IF EXISTS "All team members can read organizations" ON "public"."organizations";
DROP POLICY IF EXISTS "All organization members can read organizations" ON "public"."organizations";

BEGIN;

ALTER TABLE organizations DROP COLUMN IF EXISTS created_by;

COMMIT;



CREATE POLICY "All organization members can read organizations v2"
ON "public"."organizations"
AS permissive
FOR SELECT
TO authenticated
USING (true);


DROP TRIGGER on_organization_created_create_owner ON public.organizations;
DROP TRIGGER on_public_employee_created_create_team ON public.employees;


-- Drop a function
DROP FUNCTION IF EXISTS public.handle_create_owner_on_organization_creation();
DROP FUNCTION IF EXISTS public.handle_create_organization_for_auth_user();

drop policy "All authenticated users can create organizations" on "public"."organizations";

create policy "All authenticated users can create organizations"
on "public"."organizations"
as permissive
for insert
to authenticated
with check (true);



