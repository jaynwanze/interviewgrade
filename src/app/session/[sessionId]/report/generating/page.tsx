import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { AutoGenerateReport } from '../AutoGenerateReport';
import { generatePracticeReportAction } from '../actions';

type GeneratingReportPageProps = {
  params: { sessionId: string };
};

export default function GeneratingReportPage({
  params,
}: GeneratingReportPageProps) {
  const generateAction = generatePracticeReportAction.bind(null, params.sessionId);

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
          <AutoGenerateReport generateAction={generateAction} />
        </CardContent>
      </Card>
    </main>
  );
}
