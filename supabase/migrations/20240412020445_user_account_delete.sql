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

ALTER TABLE public.user_profiles DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;