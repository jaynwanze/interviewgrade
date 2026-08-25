-- Remove V1-era permissive read policies from legacy organization/profile data.

-- Invitations should never be publicly enumerable. Keep access to the inviter
-- and the actual invitee only.
drop policy if exists "Anyone can view" on public.organization_join_invitations;
create policy "Invitation visible to inviter or invitee"
on public.organization_join_invitations
for select
to authenticated
using (
  auth.uid() = inviter_user_id
  or auth.uid() = invitee_user_id
  or check_if_authenticated_user_owns_email(invitee_user_email)
);

-- Organization membership should only be visible to members of that same org.
drop policy if exists "Temporary : Everyone can view" on public.organization_members;
create policy "Organization members can view own organization members"
on public.organization_members
for select
to authenticated
using (
  auth.uid() in (
    select public.get_organization_member_ids(organization_members.organization_id)
  )
);

-- Organization records should only be visible to members of that org.
drop policy if exists "All organization members can read organizations v2" on public.organizations;
create policy "Organization members can read own organizations"
on public.organizations
for select
to authenticated
using (
  auth.uid() in (
    select public.get_organization_member_ids(organizations.id)
  )
);

-- Remove the blanket signed-in-user profile read. Existing own-profile and
-- same-organization profile policies remain in place.
drop policy if exists "Everyone can view user profile" on public.user_profiles;

-- These legacy surfaces are not part of anonymous V2 participation and should
-- not be discoverable through the public PostgREST/GraphQL role.
revoke select on table public.organization_join_invitations from anon;
revoke select on table public.organization_members from anon;
revoke select on table public.organizations from anon;
revoke select on table public.user_profiles from anon;
