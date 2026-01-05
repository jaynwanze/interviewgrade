'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { userRoles } from '@/utils/userTypes';
import { cache } from 'react';

// make sure to return one of UserRoles
export const serverGetUserType = cache(async () => {
  const supabase = createSupabaseUserServerComponentClient();
  const {
    data: {  user } ,
    error: sessionError,
  } = await supabase.auth.getUser();
  const session = user ? { user } : null; //session object

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
