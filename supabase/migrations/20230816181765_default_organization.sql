
-- add column if not exists
ALTER TABLE "public"."user_private_info"
ADD COLUMN IF NOT EXISTS "default_organization" uuid;

ALTER TABLE "public"."user_private_info" DROP CONSTRAINT IF EXISTS "user_private_info_default_organization_fkey";


ALTER TABLE "public"."user_private_info"
  ADD CONSTRAINT "user_private_info_default_organization_fkey" FOREIGN KEY ("default_organization") REFERENCES "public"."organizations"("id") ON DELETE
SET NULL;
