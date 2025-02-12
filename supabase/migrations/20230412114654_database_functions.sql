-- Get invited organizations for user v2
-- This function is used to get all organizations that a user has been invited to
CREATE OR REPLACE FUNCTION public.get_invited_organizations_for_user_v2(user_id uuid, user_email character varying) RETURNS TABLE(organization_id uuid) LANGUAGE plpgsql SECURITY DEFINER AS $function$ BEGIN IF (user_id IS NULL)
  AND (
    user_email IS NULL
    OR user_email = ''
  ) THEN RETURN QUERY
SELECT id
FROM organizations
WHERE 1 = 0;
END IF;
RETURN QUERY
SELECT o.id AS organization_id
FROM organizations o
  JOIN organization_join_invitations oti ON o.id = oti.organization_id
WHERE (
    (
      (
        (
          oti.invitee_user_email = user_email
          OR oti.invitee_user_email ilike concat('%', user_email, '%')
        )
      )
      OR (oti.invitee_user_id = user_id)
    )
    AND (oti.status = 'active')
  );
END;
$function$;


-- Get organizations for user
-- This function is used to get all organizations that a user is a member of
CREATE OR REPLACE FUNCTION public.get_organizations_for_user(user_id uuid) RETURNS TABLE(organization_id uuid) LANGUAGE plpgsql SECURITY DEFINER AS $function$ BEGIN RETURN QUERY
SELECT o.id AS organization_id
FROM organizations o
  JOIN organization_members ot ON o.id = ot.organization_id
WHERE ot.member_id = user_id;
END;
$function$;
