'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getSession = cache(async () => {
  const supabase = createSupabaseUserServerComponentClient();
  return await supabase.auth.getSession();
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
    redirect('/candidate/login');
  }

  return session.user;
});
