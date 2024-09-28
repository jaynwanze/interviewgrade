CREATE TABLE public.account_delete_tokens (
  token uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE
);

ALTER TABLE public.account_delete_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can request deletion" ON public.account_delete_tokens FOR
INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "User can only delete their own deletion token" ON public.account_delete_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can only update their own deletion token" ON public.account_delete_tokens FOR
UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "User can only read their own deletion token" ON public.account_delete_tokens FOR
SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.user_private_info DROP CONSTRAINT IF EXISTS user_private_info_id_fkey;

ALTER TABLE public.user_private_info
ADD CONSTRAINT user_private_info_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- ALTER TABLE ONLY "public"."organization_members"
-- ADD CONSTRAINT "organization_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."user_profiles"("id");
ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_member_id_fkey;

ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;


ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_organization_id_fkey;
ALTER TABLE public.customers
ADD CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.organization_join_invitations DROP CONSTRAINT IF EXISTS organization_join_invitations_organization_id_fkey;
ALTER TABLE public.organization_join_invitations
ADD CONSTRAINT organization_join_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


ALTER TABLE public.organization_members DROP CONSTRAINT IF EXISTS organization_members_organization_id_fkey;
ALTER TABLE public.organization_members
ADD CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


ALTER TABLE public.organizations_private_info DROP CONSTRAINT IF EXISTS organizations_private_info_id_fkey;
ALTER TABLE public.organizations_private_info
ADD CONSTRAINT organizations_private_info_id_fkey FOREIGN KEY (id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_organization_id_fkey;
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.user_private_info DROP CONSTRAINT IF EXISTS user_private_info_default_organization_fkey;
ALTER TABLE public.user_private_info
ADD CONSTRAINT user_private_info_default_organization_fkey FOREIGN KEY (default_organization) REFERENCES public.organizations(id) ON DELETE
SET NULL;