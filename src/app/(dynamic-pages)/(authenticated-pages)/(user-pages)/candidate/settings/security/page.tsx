import { PageHeading } from '@/components/PageHeading';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { UpdateEmail } from './UpdateEmail';
import { UpdatePassword } from './UpdatePassword';

export default async function SecuritySettings() {
  const user = await serverGetLoggedInUser();

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeading
        title="Security Settings"
        titleClassName="text-xl"
        subTitleClassName="text-sm -mt-1"
        subTitle="Manage the credentials you use to sign in to InterviewGrade."
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Login credentials</CardTitle>
          <CardDescription>
            Keep your email address and password up to date.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          <div className="pb-6">
            <UpdateEmail initialEmail={user.email} />
          </div>
          <div className="pt-6">
            <UpdatePassword />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
