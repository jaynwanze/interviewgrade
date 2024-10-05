import { getUserType } from '@/data/user/user';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { redirect } from 'next/navigation';

export default async function OnboardingCompletePage() {
  const user = await serverGetLoggedInUser();
  const userType = await getUserType(user.id);

  if (userType === 'candidate') {
    redirect('/dashboard/candidate');
  } else {
    redirect('/dashboard/employer');
  }
}
