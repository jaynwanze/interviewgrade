'use server';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from './verifySession';

export const serverGetLoggedInUser = cache(async () => {
  try {
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
  } catch (error) {
    // If it's a redirect, re-throw it
    if (error && typeof error === 'object' && 'digest' in error) {
      throw error;
    }
    // For other errors, redirect to login
    console.error('serverGetLoggedInUser: Unexpected error', error);
    redirect('/c/login');
  }
});
