begin;

-- Candidate-first v2 uses the existing organizations tables as a temporary
-- physical backing for invisible workspaces. A user must only have one
-- membership row per workspace so personal-workspace provisioning is safely
-- idempotent under concurrent requests.
create unique index if not exists organization_members_organization_member_unique
  on public.organization_members (organization_id, member_id);

commit;
