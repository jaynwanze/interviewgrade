-- Harden V1 SECURITY DEFINER helpers that remain for legacy organization RLS
-- and triggers. Direct RPC access is removed unless a function is required by
-- an authenticated RLS policy.

create or replace function public.check_if_authenticated_user_owns_email(email character varying)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from auth.users u
      where u.id = auth.uid()
        and lower(u.email) = lower($1)
    );
$$;

create or replace function public.get_organization_member_ids(organization_id uuid)
returns table(member_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select om.member_id
  from public.organization_members om
  where om.organization_id = $1
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members caller
      where caller.organization_id = $1
        and caller.member_id = auth.uid()
    );
$$;

create or replace function public.get_organization_admin_ids(organization_id uuid)
returns table(member_id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select om.member_id
  from public.organization_members om
  where om.organization_id = $1
    and om.member_role in ('admin', 'owner')
    and auth.uid() is not null
    and exists (
      select 1
      from public.organization_members caller
      where caller.organization_id = $1
        and caller.member_id = auth.uid()
    );
$$;

alter function public.get_organizations_for_user(uuid)
  set search_path = public, pg_temp;
alter function public.get_invited_organizations_for_user_v2(uuid, character varying)
  set search_path = public, pg_temp;
alter function public.handle_add_organization_member_after_invitation_accepted()
  set search_path = public, pg_temp;
alter function public.handle_auth_user_created()
  set search_path = public, extensions, pg_temp;
alter function public.handle_organization_created()
  set search_path = public, pg_temp;
alter function public.app_admin_get_user_id_by_email(text)
  set search_path = public, pg_temp;

-- Remove the default PUBLIC execute privilege and anonymous execution from all
-- SECURITY DEFINER helpers. Only the three helpers referenced from RLS remain
-- executable by authenticated users.
revoke all on function public.check_if_authenticated_user_owns_email(character varying) from public, anon, authenticated;
revoke all on function public.get_organization_member_ids(uuid) from public, anon, authenticated;
revoke all on function public.get_organization_admin_ids(uuid) from public, anon, authenticated;

grant execute on function public.check_if_authenticated_user_owns_email(character varying) to authenticated;
grant execute on function public.get_organization_member_ids(uuid) to authenticated;
grant execute on function public.get_organization_admin_ids(uuid) to authenticated;

revoke all on function public.get_organizations_for_user(uuid) from public, anon, authenticated;
revoke all on function public.get_invited_organizations_for_user_v2(uuid, character varying) from public, anon, authenticated;
revoke all on function public.handle_add_organization_member_after_invitation_accepted() from public, anon, authenticated;
revoke all on function public.handle_auth_user_created() from public, anon, authenticated;
revoke all on function public.handle_organization_created() from public, anon, authenticated;

-- This RPC is used only through the server-side service-role client.
revoke all on function public.app_admin_get_user_id_by_email(text) from public, anon, authenticated;
