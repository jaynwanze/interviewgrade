import { Database } from '@/lib/database.types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { createServerClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');
  const wantsV2Onboarding = requestUrl.searchParams.get('v2Onboarding') === '1';

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

  let initializedV2Onboarding = false;
  let authenticatedUser: User | null = null;

  if (code) {
    const cookieStore = await cookies();
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
              // Middleware refreshes the session cookies when needed.
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

    const {
      data: { user: oauthUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !oauthUser) {
      console.error('Failed to read user after code exchange:', userError);
      return NextResponse.redirect(new URL('/c/login', requestUrl.origin));
    }

    authenticatedUser = oauthUser;

    if (
      wantsV2Onboarding &&
      !oauthUser.user_metadata?.userType &&
      oauthUser.user_metadata?.onboardingVersion == null
    ) {
      const createdAt = Date.parse(oauthUser.created_at);
      const isNewAccount =
        Number.isFinite(createdAt) && Date.now() - createdAt < 5 * 60 * 1000;

      if (isNewAccount) {
        const { error: metadataError } = await supabase.auth.updateUser({
          data: {
            onboardingVersion: 2,
            onboardingV2Complete: false,
          },
        });

        if (metadataError) {
          console.error('Failed to initialize V2 onboarding:', metadataError);
        } else {
          initializedV2Onboarding = true;
        }
      }
    }
  }

  revalidatePath('/');

  // OAuth callbacks already have a verified user from the same Supabase client
  // that exchanged the code. Avoid immediately constructing a second auth read
  // from fresh cookies, which can make the post-login handoff unnecessarily racy.
  const user = authenticatedUser ?? (await serverGetLoggedInUser());
  const legacyUserType = user.user_metadata?.userType;
  const hasPendingV2Onboarding =
    initializedV2Onboarding ||
    (user.user_metadata?.onboardingVersion === 2 &&
      user.user_metadata?.onboardingV2Complete !== true);

  if (hasPendingV2Onboarding) {
    return NextResponse.redirect(new URL('/onboarding', requestUrl.origin));
  }

  let redirectTo = new URL(
    legacyUserType === 'employer' ? '/employer' : '/candidate/dashboard',
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
