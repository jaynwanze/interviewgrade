CREATE TRIGGER "on_organization_created"
AFTER
INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_organization_created"();
--
-- Name: organizations on_organization_created_create_owner; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "on_organization_created_create_owner"
AFTER
INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_create_owner_on_organization_creation"();
--
-- Name: organization_join_invitations on_organization_invitation_accepted_trigger; Type: TRIGGER; Schema: public; Owner: supabase_admin
--

CREATE TRIGGER "on_organization_invitation_accepted_trigger"
AFTER
UPDATE ON "public"."organization_join_invitations" FOR EACH ROW
  WHEN (
    (
      ("old"."status" <> "new"."status")
      AND (
        "new"."status" = 'finished_accepted'::"public"."organization_join_invitation_link_status"
      )
    )
  ) EXECUTE FUNCTION "public"."handle_add_organization_member_after_invitation_accepted"();
--
-- Name: customers customers_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

CREATE TRIGGER on_auth_user_created_create_profile
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_auth_user_created();

CREATE TRIGGER on_auth_user_created_create_team
AFTER
INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_create_organization_for_auth_user();

-- Create trigger function
CREATE OR REPLACE FUNCTION public.update_user_type()
RETURNS TRIGGER AS $$
DECLARE
    user_type_value public.user_types;
BEGIN
    -- Extract userType from raw metadata
    user_type_value := (NEW.raw_user_meta_data->>'userType')::public.user_types;

    -- Update user_profiles table with the extracted user type
    UPDATE public.user_profiles
    SET user_type = user_type_value
    WHERE id = NEW.id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER update_user_type_trigger
AFTER INSERT OR UPDATE ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.update_user_type();