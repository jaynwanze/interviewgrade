
-- add column if not exists
ALTER TABLE "public"."employer"
ADD COLUMN IF NOT EXISTS "default_organization" uuid;

ALTER TABLE "public"."employer" DROP CONSTRAINT IF EXISTS "employer_default_organization_fkey";


ALTER TABLE "public"."employer"
  ADD CONSTRAINT "employer_default_organization_fkey" FOREIGN KEY ("default_organization") REFERENCES "public"."organizations"("id") ON DELETE
SET NULL;
