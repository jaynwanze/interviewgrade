CREATE OR REPLACE FUNCTION app_admin_get_user_id_by_email (emailArg text) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
BEGIN IF CURRENT_ROLE NOT IN (
  'service_role',
  'supabase_admin',
  'dashboard_user',
  'postgres'
) THEN RAISE EXCEPTION 'Only service_role, supabase_admin, dashboard_user, postgres can execute this function';
END IF;

SELECT id INTO v_user_id
FROM auth.users
WHERE LOWER(email) = LOWER(emailArg);

  RETURN v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.app_admin_get_user_id_by_email(text)
FROM PUBLIC;
REVOKE ALL ON FUNCTION public.app_admin_get_user_id_by_email(text)
FROM ANON;
REVOKE ALL ON FUNCTION public.app_admin_get_user_id_by_email(text)
FROM AUTHENTICATED;
