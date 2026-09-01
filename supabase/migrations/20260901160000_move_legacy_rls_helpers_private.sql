-- Keep legacy SECURITY DEFINER helpers available to RLS without exposing them
-- as callable RPCs through the public PostgREST/GraphQL schema.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

alter function public.check_if_authenticated_user_owns_email(character varying)
  set schema private;
alter function public.get_organization_member_ids(uuid)
  set schema private;
alter function public.get_organization_admin_ids(uuid)
  set schema private;

-- ALTER FUNCTION preserves policy dependencies and existing ACLs. Re-state the
-- intended grants explicitly so future schema dumps cannot broaden execution.
revoke all on function private.check_if_authenticated_user_owns_email(character varying)
  from public, anon, authenticated;
revoke all on function private.get_organization_member_ids(uuid)
  from public, anon, authenticated;
revoke all on function private.get_organization_admin_ids(uuid)
  from public, anon, authenticated;

grant execute on function private.check_if_authenticated_user_owns_email(character varying)
  to authenticated, service_role;
grant execute on function private.get_organization_member_ids(uuid)
  to authenticated, service_role;
grant execute on function private.get_organization_admin_ids(uuid)
  to authenticated, service_role;
