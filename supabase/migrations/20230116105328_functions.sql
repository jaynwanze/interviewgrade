-- Check if user owns an email
-- This function is used to check if the authenticated user owns an email
CREATE OR REPLACE FUNCTION public.check_if_authenticated_user_owns_email(email character varying) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $function$ BEGIN -- Check if the email exists in the auth.users table
  -- and if the id column matches the auth.uid() function
  IF EXISTS (
    SELECT *
    FROM auth.users
    WHERE (
        auth.users.email = $1
        OR auth.users.email ilike concat('%', $1, '%')
      )
      AND id = auth.uid()
  ) THEN RETURN TRUE;
ELSE RETURN false;
END IF;
END;
$function$;



CREATE FUNCTION "public"."get_organization_admin_ids"("organization_id" "uuid") RETURNS TABLE("member_id" "uuid") LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- This function returns the member_id column for all rows in the organization_members table
-- where the organization_id column matches the organization_id argument.
RETURN QUERY
SELECT organization_members.member_id
FROM organization_members
WHERE organization_members.organization_id = $1
  AND (
    member_role = 'admin'
    OR member_role = 'owner'
  );
END;
$$;



CREATE FUNCTION "public"."get_organization_member_ids"("organization_id" "uuid") RETURNS TABLE("member_id" "uuid") LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN -- This function returns the member_id column for all rows in the organization_members table
-- where the organization_id column matches the organization_id argument.
RETURN QUERY
SELECT organization_members.member_id
FROM organization_members
WHERE organization_members.organization_id = $1;
END;
$$;

CREATE FUNCTION "public"."handle_add_organization_member_after_invitation_accepted"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$BEGIN
INSERT INTO organization_members(member_id, member_role, organization_id)
VALUES (
    NEW.invitee_user_id,
    NEW.invitee_organization_role,
    NEW.organization_id
  );
RETURN NEW;
END;
$$;


CREATE FUNCTION "public"."handle_auth_user_created"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.user_profiles (id)
VALUES (NEW.id);
INSERT INTO public.user_private_info (id)
VALUES (NEW.id);
RETURN NEW;
END;
$$;


CREATE FUNCTION "public"."handle_create_organization_for_auth_user"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$BEGIN
INSERT INTO public.organizations (created_by)
VALUES (NEW.id);
RETURN NEW;
END;
$$;


CREATE FUNCTION "public"."handle_create_owner_on_organization_creation"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$BEGIN
INSERT INTO public.organization_members(organization_id, member_id, member_role)
VALUES(NEW.id, NEW.created_by, 'owner');
RETURN NEW;
END $$;


CREATE FUNCTION "public"."handle_organization_created"() RETURNS "trigger" LANGUAGE "plpgsql" SECURITY DEFINER AS $$ BEGIN
INSERT INTO public.organizations_private_info (id)
VALUES (NEW.id);
RETURN NEW;
END;
$$;
