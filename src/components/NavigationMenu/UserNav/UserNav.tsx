import Notifications from '@/components/Notifcations';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getUserProfile } from '@/data/user/user';
import { getUserAvatarUrl } from '@/utils/helpers';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { UserNavDropDownMenu } from './UserNavDropDownMenu';
import { Tokens } from '@/components/Tokens';

export async function UserNav() {
  const user = await serverGetLoggedInUser();
  const { email } = user;
  if (!email) {
    // unreachable
    throw new Error('User email not found');
  }

  const userProfile = await getUserProfile(user.id);
  return (
    <>
      <ThemeToggle />
      <Notifications />
      <UserNavDropDownMenu
        avatarUrl={getUserAvatarUrl({
          email,
          profileAvatarUrl: userProfile.avatar_url,
        })}
        userFullname={userProfile.full_name ?? `User ${email}`}
        userEmail={email}
        userId={user.id}
      />
      {/* <Tokens /> */}
    </>
  );
}
