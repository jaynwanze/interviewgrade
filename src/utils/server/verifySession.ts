'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getSession = cache(async () => {
  try {
    const supabase = createSupabaseUserServerComponentClient();
    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    // Handle AuthSessionMissingError gracefully
    if (sessionError) {
      // Log the error but don't throw - return null session
      console.error('getSession: Auth error', sessionError.message);
      return { data: { session: null }, error: null };
    }

    const session = user ? { user } : null;
    return { data: { session }, error: null };
  } catch (error) {
    // Catch any unexpected errors and return null session
    console.error('getSession: Unexpected error', error);
    return { data: { session: null }, error: null };
  }
});

// This is a server-side function that verifies the session of the user.
// and runs in server components.
export const verifySession = cache(async () => {
  const {
    data: { session },
  } = await getSession();

  if (!session?.user) {
    redirect('/c/login');
  }

  return session.user;
});
