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
    
    RETURN NEW;
EXCEPTION WHEN others THEN
    RAISE NOTICE 'Error in handle_auth_user_created: %', SQLERRM;
    RETURN NULL;
END;
$$;
