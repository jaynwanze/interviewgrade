import {
  fetchSlimOrganizations,
  getDefaultOrganization,
  setDefaultOrganization,
} from '@/data/user/organizations';
import { getUserProfile, getUserType } from '@/data/user/user';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { authUserMetadataSchema } from '@/utils/zod-schemas/authUserMetadata';
import { UserOnboardingFlow } from './OnboardingFlow';
import { V2OnboardingFlow } from './V2OnboardingFlow';

async function getDefaultOrganizationOrSet(): Promise<string | null> {
  const [slimOrganizations, defaultOrganizationId] = await Promise.all([
    fetchSlimOrganizations(),
    getDefaultOrganization(),
  ]);
  const firstOrganization = slimOrganizations[0];

  if (defaultOrganizationId) return defaultOrganizationId;
  if (!firstOrganization) return null;

  await setDefaultOrganization(firstOrganization.id);
  return firstOrganization.id;
}

export default async function Onboarding() {
  const user = await serverGetLoggedInUser();
  const onboardingStatus = authUserMetadataSchema.parse(user.user_metadata);
  const userProfile = await getUserProfile(user.id);

  if (onboardingStatus.onboardingVersion === 2) {
    return (
      <main className="min-h-dvh overflow-y-auto bg-muted/20 px-4 py-8 sm:flex sm:items-center sm:justify-center sm:py-12">
        <V2OnboardingFlow
          userProfile={userProfile}
          onboardingStatus={onboardingStatus}
          userEmail={user.email}
        />
      </main>
    );
  }

  const userType = await getUserType(user.id);
  if (userType === 'employer') {
    await getDefaultOrganizationOrSet();
  }

  return (
    <div className="fixed inset-0 flex h-full flex-col items-center justify-center">
      <UserOnboardingFlow
        userProfile={userProfile}
        onboardingStatus={onboardingStatus}
        userEmail={user.email}
        userType={userType}
      />
    </div>
  );
}
