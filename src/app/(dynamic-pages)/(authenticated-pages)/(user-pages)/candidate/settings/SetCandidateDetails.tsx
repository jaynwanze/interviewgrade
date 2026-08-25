import { getUserProfile } from '@/data/user/user';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { CandidateAccountSettings } from './AccountSettings';

export async function SetCandidateAccountDetails() {
  const user = await serverGetLoggedInUser();
  const userProfile = await getUserProfile(user.id);

  return (
    <div className="w-full max-w-3xl">
      <CandidateAccountSettings
        userProfile={userProfile}
        userEmail={user.email}
      />
    </div>
  );
}
