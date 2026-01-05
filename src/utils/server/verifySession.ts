'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getSession = cache(async () => {
  const supabase = createSupabaseUserServerComponentClient();
  const {
    data: {  user } ,
    error: sessionError,
  } = await supabase.auth.getUser();
  const session = user ? { user } : null; //session object
  return { data: { session }, error: sessionError };
});

// This is a server-side function that verifies the session of the user.
// and runs in server components.
export const verifySession = cache(async () => {
  const {
    data: { session },
    error: sessionError,
  } = await getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user) {
    redirect('/c/login');
  }

  return session.user;
});
