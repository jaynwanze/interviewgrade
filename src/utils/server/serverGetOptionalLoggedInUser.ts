import 'server-only';

import { cache } from 'react';

import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';

/**
 * Resolve the current Supabase user without redirecting anonymous visitors.
 *
 * Public v2 practice links remain anonymous-capable, while authenticated
 * candidates can be attached to the session for history and analytics.
 */
export const serverGetOptionalLoggedInUser = cache(async () => {
  try {
    const supabase = createSupabaseUserServerComponentClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ?? null;
  } catch {
    return null;
  }
});
