'use server';
import { cache } from 'react';
import { getSession } from './verifySession';

export const serverGetLoggedInUser = cache(async () => {
  const {
    data: { session },
    error: sessionError,
  } = await getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session?.user) {
    throw new Error('serverGetLoggedInUser: Not logged in');
  }

  return session.user;
});
