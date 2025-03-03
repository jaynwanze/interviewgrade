import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      },
    });
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Failed to exchange code for session: ', error);
    }
  }

  revalidatePath('/');
  const user = await serverGetLoggedInUser();
  const userType: string = user.user_metadata.userType;

  let redirectTo = new URL('/', requestUrl.origin);

  if (userType === 'candidate') {
    redirectTo = new URL('/candidate', requestUrl.origin);
  } else {
    redirectTo = new URL('/employer', requestUrl.origin);
  }

  if (next) {
    const decodedNext = decodeURIComponent(next);
    redirectTo = new URL(decodedNext, requestUrl.origin);
  }

  // Instead of redirecting, return a JSON response with the redirect URL
  return new Response(JSON.stringify({ redirectTo: redirectTo.toString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
