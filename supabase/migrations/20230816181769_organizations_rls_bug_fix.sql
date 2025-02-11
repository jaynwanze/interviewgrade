DROP POLICY "All authenticated users can create organizations" ON "public"."organizations";
CREATE POLICY "All authenticated users can create organizations" ON "public"."organizations" FOR
INSERT TO "authenticated" WITH CHECK (TRUE);
