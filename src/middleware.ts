import { User, createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
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
  `/organization(/.*)?`, // matches /organization and any sub route of /organization
  `/project(/.*)?`, // matches /project and any sub route of /project
  `/settings(/.*)?`,
  `/invitations`,
  `/render/(.*)?`,
  `/dashboard/candidate`,
  `/dashboard/employer`,
  '/candidate',
  '/employer',
  onboardingPaths,
];

// For candidate routes:
function isCandidateRoute(pathname: string) {
  return (
    pathname.startsWith('/candidate') ||
    pathname.startsWith('/dashboard/candidate')
  );
}

// For employer routes:
function isEmployerRoute(pathname: string) {
  return (
    pathname.startsWith('/employer') ||
    pathname.startsWith('/dashboard/employer')
  );
}

function isProtectedPage(pathname: string) {
  // is exact match or starts with a protected page prefix

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
    const {
      onboardingHasAcceptedTerms,
      onboardingHasCompletedProfile,
      onboardingHasCompletedCandidateDetails,
      onboardingHasCreatedOrganization,
      onboardingHasSetEmployerPrefs,
    } = userMetadata;

    // Check if user is a candidate
    const isCandidate = userMetadata.userType === 'candidate'; // Assuming userType is part of user metadata
    if (
      isCandidate &&
      (!onboardingHasAcceptedTerms ||
        !onboardingHasCompletedProfile ||
        !onboardingHasCompletedCandidateDetails)
    ) {
      return true;
    } else if (
      userMetadata.userType === 'employer' &&
      (!onboardingHasAcceptedTerms ||
        !onboardingHasCreatedOrganization ||
        !onboardingHasSetEmployerPrefs)
    ) {
      return true;
    }
  }
  return false;
}

// this middleware refreshes the user's session and must be run
// for any Server Component route that uses `createServerComponentSupabaseClient`
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  const sessionResponse = await supabase.auth.getSession();
  const maybeUser = sessionResponse?.data.session?.user;

  // If route is protected but no user => redirect to login
  if (isProtectedPage(req.nextUrl.pathname) && !maybeUser) {
    return NextResponse.redirect(toSiteURL('/candidate/sign-in'));
  }

  // If user is present, parse their user type
  if (maybeUser) {
    const userMetadata = authUserMetadataSchema.parse(maybeUser.user_metadata);
    const userType = userMetadata.userType; // 'candidate' or 'employer', etc.
    if (shouldOnboardUser(req.nextUrl.pathname, maybeUser)) {
      return NextResponse.redirect(toSiteURL('/onboarding'));
    }
    // If it’s a candidate route but user is employer => redirect
    if (isCandidateRoute(req.nextUrl.pathname) && userType !== 'candidate') {
      return NextResponse.redirect(toSiteURL('/employer'));
    }
    // If it’s an employer route but user is candidate => redirect
    if (isEmployerRoute(req.nextUrl.pathname) && userType !== 'employer') {
      return NextResponse.redirect(toSiteURL('/candidate'));
    }
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api (API routes)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
