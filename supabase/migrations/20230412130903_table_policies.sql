CREATE policy "Inviter can delete the invitation" ON "public"."organization_join_invitations" AS permissive FOR DELETE TO authenticated USING ((auth.uid() = inviter_user_id));


CREATE policy "Enable delete for users based on user_id" ON "public"."organization_members" AS permissive FOR DELETE TO authenticated USING (
  (
    auth.uid() IN (
      SELECT get_organization_admin_ids(organization_members.organization_id) AS get_organization_admin_ids
    )
  )
);


CREATE policy "Temporary : Everyone can view" ON "public"."organization_members" AS permissive FOR
SELECT TO authenticated USING (TRUE);







CREATE policy "Everyone can view user profile" ON "public"."user_profiles" AS permissive FOR
SELECT TO authenticated USING (TRUE);


CREATE policy "All team members can read organizations" ON "public"."organizations" AS permissive FOR
SELECT TO authenticated USING (
    (
      (auth.uid() = created_by)
      OR (
        auth.uid() IN (
          SELECT get_organization_member_ids(organizations.id) AS get_organization_member_ids
        )
      )
      OR (
        id IN (
          SELECT get_invited_organizations_for_user_v2(
              auth.uid(),
              ((auth.jwt()->>'email'::text))::character varying
            ) AS get_invited_organizations_for_user_v2
        )
      )
    )
  );
