drop policy if exists "All authenticated users can request deletion" on public.account_delete_tokens;

create policy "Users can request only their own deletion token"
on public.account_delete_tokens
for insert
to authenticated
with check (auth.uid() = user_id);

-- Account deletion is an authenticated flow; it should not be discoverable to
-- the anonymous PostgREST/GraphQL role.
revoke select on table public.account_delete_tokens from anon;
