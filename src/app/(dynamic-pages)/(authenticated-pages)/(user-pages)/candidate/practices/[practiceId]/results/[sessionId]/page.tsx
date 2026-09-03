import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  MessageSquareText,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createEvaluationService } from '@/modules/evaluation/evaluation.service';
import { creatorOwnsPracticeSession } from '@/modules/practice/creator-practice-results';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

type CreatorResultPageProps = {
  params: Promise<{
    practiceId: string;
    sessionId: string;
  }>;
};

export default async function CreatorResultPage(props: CreatorResultPageProps) {
  const params = await props.params;
  const user = await serverGetLoggedInUser();
  const ownsSession = await creatorOwnsPracticeSession(
    params.practiceId,
    params.sessionId,
    user.id,
  );

  if (!ownsSession) {
    notFound();
  }

  const report = await createEvaluationService().getExistingReport(params.sessionId);

  if (!report) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href={`/candidate/practices/${params.practiceId}/results`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Results
          </Link>
        </Button>
        <Card className="border-dashed text-center">
          <CardHeader>
            <CardTitle>Final result not available yet</CardTitle>
            <CardDescription>
              The participant session exists, but a completed structured report has
              not been persisted for it yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { session, practiceVersion, sessionEvaluation } = report;
  const score = Math.round(sessionEvaluation.overallScore);
  const identity =
    session.participantName ||
    session.participantEmail ||
    (session.participantUserId ? 'Signed-in participant' : 'Guest participant');
  const rubricWeightById = new Map(
    practiceVersion.snapshot.rubricCriteria
      .filter((criterion) => Boolean(criterion.id))
      .map((criterion) => [criterion.id!, criterion.weight] as const),
  );

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href={`/candidate/practices/${params.practiceId}/results`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Results
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <UserRound className="h-4 w-4" />
              {identity}
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {practiceVersion.snapshot.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Version {practiceVersion.version} · {report.responses.length} evaluated
              response{report.responses.length === 1 ? '' : 's'}
              {session.completedAt
                ? ` · completed ${formatDateTime(session.completedAt)}`
                : ''}
            </p>
            {session.participantName && session.participantEmail && (
              <p className="mt-1 text-sm text-muted-foreground">
                {session.participantEmail}
              </p>
            )}
          </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="shadow-sm">
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
            {sessionEvaluation.summary && (
              <p className="text-sm leading-6 text-muted-foreground">
                {sessionEvaluation.summary}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Rubric performance
            </CardTitle>
            <CardDescription>
              Final criterion scores from this participant attempt.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {sessionEvaluation.criterionScores.map((criterion) => (
              <div key={criterion.criterionId} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{criterion.criterionName}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {rubricWeightById.get(criterion.criterionId) ?? 0}% rubric weight
                    </div>
                  </div>
                  <div className="font-semibold">
                    {Math.round(criterion.score)}/100
                  </div>
                </div>
                <Progress value={criterion.score} className="mt-3" />
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
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
            Review the participant transcript and the structured evaluation for each
            answered question.
          </p>
        </div>

        <div className="space-y-4">
          {report.responses.map(({ response, question, evaluation }, index) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardDescription>Question {index + 1}</CardDescription>
                    <CardTitle className="mt-1 text-xl leading-snug">
                      {question.prompt}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-2xl font-bold ${scoreClass(evaluation.overallScore)}`}
                    >
                      {Math.round(evaluation.overallScore)}/100
                    </div>
                    <div className="text-xs text-muted-foreground">question score</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <MessageSquareText className="h-4 w-4" />
                    Participant response
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
                      <div className="flex items-start justify-between gap-2 text-sm">
                        <span className="font-medium">{criterion.criterionName}</span>
                        <span>{Math.round(criterion.score)}/100</span>
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
        <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function scoreClass(score: number) {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-amber-600 dark:text-amber-400';
  if (score >= 40) return 'text-orange-600 dark:text-orange-400';
  return 'text-destructive';
}

function scoreBand(score: number) {
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Developing well';
  if (score >= 40) return 'Needs development';
  return 'Needs significant development';
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
