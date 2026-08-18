import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { EvaluationReport } from '@/modules/evaluation/evaluation.service';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

import { generatePracticeReportAction } from './actions';

type ReportPageProps = {
  params: { sessionId: string };
  searchParams?: { error?: string };
};

type ReportLoadResult =
  | { state: 'ready'; report: EvaluationReport }
  | { state: 'not-found' }
  | { state: 'not-complete' }
  | { state: 'pending' }
  | { state: 'unavailable' };

async function loadReport(sessionId: string): Promise<ReportLoadResult> {
  try {
    const loggedInUser = await serverGetOptionalLoggedInUser();
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const sessionService = createPublicSessionService();
    const session = await sessionService.getAccessibleById(
      sessionId,
      loggedInUser?.id ?? null,
    );

    if (!session) return { state: 'not-found' };
    if (session.status !== 'completed') return { state: 'not-complete' };

    const { createEvaluationService } = await import(
      '@/modules/evaluation/evaluation.service'
    );
    const report = await createEvaluationService().getExistingReport(sessionId);
    return report ? { state: 'ready', report } : { state: 'pending' };
  } catch (error) {
    console.error('PracticeReportPage: report persistence unavailable', error);
    return { state: 'unavailable' };
  }
}

export default async function PracticeReportPage({
  params,
  searchParams,
}: ReportPageProps) {
  const result = await loadReport(params.sessionId);

  if (result.state === 'not-found') {
    return (
      <ReportStateCard
        title="Report not found"
        description="This InterviewGrade session does not exist or is no longer available."
      />
    );
  }

  if (result.state === 'not-complete') {
    return (
      <ReportStateCard
        title="Finish the practice first"
        description="A final report is created after the practice session is completed."
        href={`/session/${params.sessionId}`}
        action="Return to session"
      />
    );
  }

  if (result.state === 'pending') {
    const retryAction = generatePracticeReportAction.bind(null, params.sessionId);
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <CardTitle>Generate final report</CardTitle>
            <CardDescription>
              {searchParams?.error === 'evaluation'
                ? 'The previous evaluation attempt did not complete. Your responses are saved safely and can be evaluated again.'
                : 'Your responses are saved. Generate the structured rubric evaluation when you are ready.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={retryAction}>
              <Button type="submit">Generate report</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (result.state === 'unavailable') {
    return (
      <ReportStateCard
        title="Report temporarily unavailable"
        description="Your saved responses are safe, but the report persistence service is unavailable in this environment."
      />
    );
  }

  const { report } = result;
  const { sessionEvaluation, practiceVersion } = report;
  const score = Math.round(sessionEvaluation.overallScore);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              InterviewGrade final report
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {practiceVersion.snapshot.title}
            </h1>
            <p className="max-w-3xl text-muted-foreground">
              Version {practiceVersion.version} · {report.responses.length} evaluated
              response{report.responses.length === 1 ? '' : 's'} · latest attempt per
              question
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/session/${report.session.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Session
            </Link>
          </Button>
        </header>

        <section className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <Card className="shadow-md">
            <CardHeader className="text-center">
              <CardDescription>Overall score</CardDescription>
              <div className={`text-6xl font-bold tracking-tight ${scoreClass(score)}`}>
                {score}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {scoreBand(score)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={score} />
              <p className="text-sm leading-6 text-muted-foreground">
                {sessionEvaluation.summary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Rubric performance
              </CardTitle>
              <CardDescription>
                Criterion scores are averaged across the latest evaluated response for
                each answered question.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {sessionEvaluation.criterionScores.map((criterion) => (
                <div key={criterion.criterionId} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">{criterion.criterionName}</div>
                    <div className="font-semibold">{Math.round(criterion.score)}/100</div>
                  </div>
                  <Progress value={criterion.score} className="mt-3" />
                  <p className="mt-3 text-xs text-muted-foreground">
                    {criterion.feedback}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <InsightCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            title="Strengths"
            items={sessionEvaluation.strengths}
          />
          <InsightCard
            icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
            title="Areas to improve"
            items={sessionEvaluation.improvements}
          />
        </section>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommended next step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-7">{sessionEvaluation.recommendation}</p>
          </CardContent>
        </Card>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Response review</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Each response below is scored against the published rubric. Older retry
              attempts remain stored as history but are not double-counted here.
            </p>
          </div>

          <div className="space-y-4">
            {report.responses.map(({ response, question, evaluation }, index) => (
              <Card key={response.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardDescription>
                        Question {index + 1} · Attempt {response.attemptNumber}
                      </CardDescription>
                      <CardTitle className="mt-1 text-xl leading-snug">
                        {question.prompt}
                      </CardTitle>
                    </div>
                    <div className={`text-2xl font-bold ${scoreClass(evaluation.overallScore)}`}>
                      {Math.round(evaluation.overallScore)}/100
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                      <MessageSquareText className="h-4 w-4" />
                      Your response
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {response.transcript}
                    </p>
                  </div>

                  {evaluation.summary && (
                    <div>
                      <div className="text-sm font-medium">Evaluation summary</div>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {evaluation.summary}
                      </p>
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    {evaluation.criterionScores.map((criterion) => (
                      <div key={criterion.criterionId} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{criterion.criterionName}</span>
                          <span>{Math.round(criterion.score)}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {criterion.feedback}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function InsightCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
          {items.map((item, index) => (
            <li key={`${title}-${index}`} className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ReportStateCard({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {href && action && (
          <CardContent>
            <Button asChild>
              <Link href={href}>{action}</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </main>
  );
}

function scoreClass(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 65) return 'text-lime-600 dark:text-lime-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function scoreBand(score: number): string {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 55) return 'Developing well';
  if (score >= 40) return 'Needs improvement';
  return 'Needs focused practice';
}
