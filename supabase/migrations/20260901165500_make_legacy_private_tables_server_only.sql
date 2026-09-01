-- Account-deletion tokens and private organization metadata are handled only
-- by authenticated server actions, service-role routes, or database triggers.
-- Remove their remaining browser-role API surface.

drop policy if exists "User can only delete their own deletion token"
  on public.account_delete_tokens;
drop policy if exists "All authenticated users can request deletion"
  on public.account_delete_tokens;
drop policy if exists "User can only read their own deletion token"
  on public.account_delete_tokens;
drop policy if exists "User can only update their own deletion token"
  on public.account_delete_tokens;

drop policy if exists "Only organization owners/admins can view private organizations "
  on public.organizations_private_info;
drop policy if exists "Only organization owners/admins can update private organization"
  on public.organizations_private_info;

revoke all on table public.account_delete_tokens from anon, authenticated;
revoke all on table public.organizations_private_info from anon, authenticated;
