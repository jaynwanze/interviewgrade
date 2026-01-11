'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { userRoles } from '@/utils/userTypes';
import { cache } from 'react';

// make sure to return one of UserRoles
export const serverGetUserType = cache(async () => {
  try {
    const supabase = createSupabaseUserServerComponentClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();
    const session = user ? { user } : null;

    // Handle auth errors gracefully - return ANON instead of throwing
    if (sessionError) {
      console.error('serverGetUserType: Auth error', sessionError.message);
      return userRoles.ANON;
    }

    if (!session?.user) {
      return userRoles.ANON;
    }

    if (
      'user_role' in session.user &&
      session.user.user_role == userRoles.ADMIN
    ) {
      return userRoles.ADMIN;
    }

    return userRoles.USER;
  } catch (error) {
    console.error('serverGetUserType: Unexpected error', error);
    return userRoles.ANON;
  }
});
