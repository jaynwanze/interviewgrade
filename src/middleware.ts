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
  `/employer/dashboard`,
  `/settings(/.*)?`,
  `/invitations`,
  `/render/(.*)?`,
  `/dashboard/candidate`,
  onboardingPaths,
];

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
      onboardingHasCreatedOrganization,
    } = userMetadata;

    // Check if user is a candidate
    const isCandidate = userMetadata.userType === 'candidate'; // Assuming userType is part of user metadata
    if (
      !onboardingHasAcceptedTerms ||
      !onboardingHasCompletedProfile ||
      (!isCandidate && !onboardingHasCreatedOrganization) // Skip check for candidates
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
  if (shouldOnboardUser(req.nextUrl.pathname, maybeUser)) {
    return NextResponse.redirect(toSiteURL('/onboarding'));
  }
  if (isProtectedPage(req.nextUrl.pathname) && maybeUser) {
    // user is possibly logged in, but lets validate session
    const user = await supabase.auth.getUser();
    if (user.error) {
      return NextResponse.redirect(toSiteURL('/candidate/login'));
    }
  }
  if (isProtectedPage(req.nextUrl.pathname) && !maybeUser) {
    return NextResponse.redirect(toSiteURL('/candidate/login'));
  }
  return res;
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
