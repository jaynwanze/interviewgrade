import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      // Handle error
      console.error('Failed to exchange code for session: ', error);
      // Potentially return an error response here
    }
  }

  revalidatePath('/');
  // Initialize redirectTo variable
  let redirectTo: URL;
  // Retrieve user metadata from cookies
  const user = await serverGetLoggedInUser();

  const userType: string = user.user_metadata.userType;

  // Determine redirect based on userType
  if (userType === 'candidate') {
    redirectTo = new URL('/candidate/dashboard', requestUrl.origin); // Redirect candidate to their dashboard
  } else {
    redirectTo = new URL('/dashboard', requestUrl.origin); // Redirect employer to their dashboard
  }

  if (next) {
    // decode next param
    const decodedNext = decodeURIComponent(next);
    // validate next param
    redirectTo = new URL(decodedNext, requestUrl.origin);
  }
  return NextResponse.redirect(redirectTo);
}
