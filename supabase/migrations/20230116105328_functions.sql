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


CREATE OR REPLACE FUNCTION "public"."handle_auth_user_created"()
RETURNS "trigger"
LANGUAGE "plpgsql"
SECURITY DEFINER
AS $$
DECLARE
    user_type_value public.user_types;
    new_token_id UUID;
BEGIN
    -- Extract userType from raw metadata
    user_type_value := (NEW.raw_user_meta_data->>'userType')::public.user_types;

    -- Insert into user_profiles
    INSERT INTO public.user_profiles (id, user_type)
    VALUES (NEW.id, user_type_value);
    
    -- Handle based on user_type
    IF user_type_value = 'candidate' THEN
        -- Create a token first
        INSERT INTO public.tokens (id, tokens_available, total_tokens_used, total_tokens_purchased, last_purchase_date)
        VALUES (extensions.uuid_generate_v4(), 5, 0, 0, NOW())
        RETURNING id INTO new_token_id;
        
        -- Insert into candidate with the newly created token
        INSERT INTO public.candidates (id, token_id)
        VALUES (NEW.id, new_token_id);
    END IF;

    IF user_type_value = 'employer' THEN
        --Insert into employer
        INSERT INTO public.employees(id)
        VALUES (NEW.id);
       -- Call the function to create an organization
         PERFORM public.handle_create_organization_for_auth_user();
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error in handle_auth_user_created: %', SQLERRM;
    RETURN NULL;
END;
$$;

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
