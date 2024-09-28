'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { userRoles } from '@/utils/userTypes';
import { cache } from 'react';

// make sure to return one of UserRoles
export const serverGetUserType = cache(async () => {
  const supabase = createSupabaseUserServerComponentClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
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
});
