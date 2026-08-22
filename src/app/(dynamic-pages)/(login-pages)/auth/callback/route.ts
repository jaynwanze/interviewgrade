import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

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
        'Access-Control-Allow-Headers':
          'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
      },
    });
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options),
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if middleware is refreshing user sessions.
            }
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('Failed to exchange code for session:', error);
      return NextResponse.redirect(new URL('/c/login', requestUrl.origin));
    }
  }

  revalidatePath('/');

  const user = await serverGetLoggedInUser();
  const legacyUserType = user.user_metadata?.userType;

  // Employer is the only legacy account type that needs its old shell. New V2
  // OAuth users do not carry userType metadata and should enter the V2 candidate
  // shell, where Creator/Participant behavior is resource-based rather than a
  // permanent account role.
  let redirectTo = new URL(
    legacyUserType === 'employer' ? '/employer' : '/candidate',
    requestUrl.origin,
  );

  if (next) {
    try {
      const decodedNext = decodeURIComponent(next);
      if (decodedNext.startsWith('/') && !decodedNext.startsWith('//')) {
        redirectTo = new URL(decodedNext, requestUrl.origin);
      }
    } catch {
      // Keep the default authenticated destination for malformed next values.
    }
  }

  return NextResponse.redirect(redirectTo);
}
