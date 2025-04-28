
import { T } from '@/components/ui/Typography';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { Suspense } from 'react';
import { SetCandidateAccountDetails } from './SetCandidateDetails';

export default async function AccountSettingsPage() {
  const user = await serverGetLoggedInUser();

  if (!user) {
    return <p className="text-sm"> User not found</p>;
  }

  return (
    <Suspense fallback={<T.Subtle>Loading...</T.Subtle>}>
      <SetCandidateAccountDetails />
    </Suspense>
  );
}
