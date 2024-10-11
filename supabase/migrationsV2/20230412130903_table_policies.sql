CREATE policy "Everyone can view user profile" ON "public"."user_profiles" AS permissive FOR
SELECT TO authenticated USING (TRUE);