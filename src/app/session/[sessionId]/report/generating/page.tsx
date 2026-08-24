import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

import { AutoGenerateReport } from '../AutoGenerateReport';

type GeneratingReportPageProps = {
  params: { sessionId: string };
};

export default async function GeneratingReportPage({
  params,
}: GeneratingReportPageProps) {
  const loggedInUser = await serverGetOptionalLoggedInUser();
  const homeHref = loggedInUser ? '/candidate/dashboard' : '/';
  const homeLabel = loggedInUser ? 'Go to dashboard' : 'Go home';

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Practice complete</CardTitle>
          <CardDescription>
            Your responses are saved. We’re preparing your final report now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutoGenerateReport
            sessionId={params.sessionId}
            homeHref={homeHref}
            homeLabel={homeLabel}
          />
        </CardContent>
      </Card>
    </main>
  );
}
