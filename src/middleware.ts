import { User } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { match } from 'path-to-regexp';
import { Database } from './lib/database.types';
import { toSiteURL } from './utils/helpers';
import { authUserMetadataSchema } from './utils/zod-schemas/authUserMetadata';

const onboardingPaths = `/onboarding/(.*)?`;
// Using a middleware to protect pages from unauthorized access
// may seem repetitive however it massively increases the security
// and performance of your application. This is because the middleware
// runs first on the server and can bail out early before the
// server component is even rendered. This means no database queries
// or other expensive operations are run if the user is not authorized.
const protectedPagePrefixes = [
  `/organization(/.*)?`,
  `/project(/.*)?`,
  `/settings(/.*)?`,
  `/invitations`,
  `/render/(.*)?`,
  `/dashboard/candidate`,
  `/dashboard/employer`,
  '/candidate',
  '/employer',
  onboardingPaths,
];

function isCandidateRoute(pathname: string) {
  return (
    pathname.startsWith('/candidate') ||
    pathname.startsWith('/dashboard/candidate')
  );
}

function isEmployerRoute(pathname: string) {
  return (
    pathname.startsWith('/employer') ||
    pathname.startsWith('/dashboard/employer')
  );
}

function isProtectedPage(pathname: string) {
  return protectedPagePrefixes.some((prefix) => {
    const matchPath = match(prefix);
    return matchPath(pathname);
  });
}

function shouldOnboardUser(pathname: string, user: User | undefined) {
  const matchOnboarding = match(onboardingPaths);
  const isOnboardingRoute = matchOnboarding(pathname);
  if (isProtectedPage(pathname) && user && !isOnboardingRoute) {
    const userMetadata = authUserMetadataSchema.parse(user.user_metadata);
    const legacyUserType = user.user_metadata?.userType;
    const {
      onboardingHasAcceptedTerms,
      onboardingHasCompletedProfile,
      onboardingHasCompletedCandidateDetails,
      onboardingHasCreatedOrganization,
      onboardingHasSetEmployerPrefs,
    } = userMetadata;

    // Only explicit legacy account types use the old onboarding requirements.
    // New V2 OAuth users do not have a permanent candidate/employer role.
    if (
      legacyUserType === 'candidate' &&
      (!onboardingHasAcceptedTerms ||
        !onboardingHasCompletedProfile ||
        !onboardingHasCompletedCandidateDetails)
    ) {
      return true;
    }

    if (
      legacyUserType === 'employer' &&
      (!onboardingHasAcceptedTerms ||
        !onboardingHasCreatedOrganization ||
        !onboardingHasSetEmployerPrefs)
    ) {
      return true;
    }
  }
  return false;
}

export async function middleware(req: NextRequest) {
  if (req.method === 'OPTIONS') {
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

  let supabaseResponse = NextResponse.next({
    request: req,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  supabaseResponse.headers.set('Access-Control-Allow-Origin', '*');
  supabaseResponse.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS',
  );
  supabaseResponse.headers.set(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
  );

  const {
    data: { user: maybeUser },
  } = await supabase.auth.getUser();

  if (isProtectedPage(req.nextUrl.pathname) && !maybeUser) {
    const redirectResponse = NextResponse.redirect(toSiteURL('/c/login'));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  if (maybeUser) {
    const legacyUserType = maybeUser.user_metadata?.userType;

    if (shouldOnboardUser(req.nextUrl.pathname, maybeUser)) {
      const redirectResponse = NextResponse.redirect(toSiteURL('/onboarding'));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Only an explicit legacy employer account is blocked from the V2 user
    // shell. Missing userType is the normal V2 OAuth case.
    if (
      isCandidateRoute(req.nextUrl.pathname) &&
      legacyUserType === 'employer'
    ) {
      const redirectResponse = NextResponse.redirect(toSiteURL('/employer'));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    // Employer routes remain legacy-only. Candidate and role-less V2 users are
    // sent back to the V2 user shell.
    if (
      isEmployerRoute(req.nextUrl.pathname) &&
      legacyUserType !== 'employer'
    ) {
      const redirectResponse = NextResponse.redirect(toSiteURL('/candidate'));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
