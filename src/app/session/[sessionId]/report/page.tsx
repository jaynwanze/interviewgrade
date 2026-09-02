import Link from 'next/link';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  ChevronDown,
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
import {
  SESSION_AGGREGATION_VERSION,
  type EvaluationReport,
} from '@/modules/evaluation/evaluation.service';
import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

import { generatePracticeReportAction } from './actions';
import { ExportReportButton } from './ExportReportButton';
import styles from './report-layout.module.css';

type ReportPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ error?: string }>;
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

export default async function PracticeReportPage(props: ReportPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
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
    const retrying = searchParams?.error === 'evaluation';

    return (
      <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto flex w-full max-w-2xl flex-col items-center">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="mb-8 max-w-xl text-center">
            <div className="text-sm font-medium text-primary">Final report</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              {retrying ? 'Your report is ready to retry' : 'Turn your answers into a coaching report'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              {retrying
                ? 'The previous evaluation attempt did not complete. Your responses are saved safely, so you can run the rubric evaluation again.'
                : 'Your responses are saved. InterviewGrade will evaluate them against the published rubric and build your final coaching report.'}
            </p>
          </div>

          <Card className="w-full overflow-hidden border-primary/15 shadow-sm">
            <CardContent className="p-0">
              <div className="grid gap-px bg-border sm:grid-cols-3">
                <ReportStep
                  number="1"
                  title="Responses saved"
                  description="Your submitted answers are safely stored."
                  complete
                />
                <ReportStep
                  number="2"
                  title="Rubric evaluation"
                  description="Score each answer against the Practice criteria."
                />
                <ReportStep
                  number="3"
                  title="Coaching report"
                  description="See strengths, improvements and next steps."
                />
              </div>
              <div className="flex flex-col gap-3 bg-background p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-muted-foreground">
                  Generation may take a few moments. You only need to start it once.
                </p>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/candidate/interview-history">Back to history</Link>
                  </Button>
                  <form action={retryAction}>
                    <Button type="submit" size="sm" className="w-full sm:w-auto">
                      <Sparkles className="mr-2 h-4 w-4" />
                      {retrying ? 'Retry report' : 'Generate report'}
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
  const rubricWeightById = new Map(
    practiceVersion.snapshot.rubricCriteria
      .filter((criterion) => Boolean(criterion.id))
      .map((criterion) => [criterion.id!, criterion.weight] as const),
  );
  const evidenceWeight = sessionEvaluation.criterionScores.reduce(
    (sum, criterion) => sum + (rubricWeightById.get(criterion.criterionId) ?? 0),
    0,
  );
  const scoringRows = sessionEvaluation.criterionScores.map((criterion) => {
    const publishedWeight = rubricWeightById.get(criterion.criterionId) ?? 0;
    const effectiveWeight =
      evidenceWeight > 0 ? (publishedWeight / evidenceWeight) * 100 : 0;
    const contribution = (criterion.score * effectiveWeight) / 100;

    return {
      criterion,
      publishedWeight,
      effectiveWeight,
      contribution,
    };
  });
  const usesCurrentAggregation =
    sessionEvaluation.modelMetadata.promptVersion === SESSION_AGGREGATION_VERSION;

  return (
    <main className={`${styles.printRoot} min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-6 sm:px-6 sm:py-9`}>
      <div className={`mx-auto w-full max-w-6xl space-y-6 ${styles.reportShell}`}>
        <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Final report
            </div>
            <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
              {practiceVersion.snapshot.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              {report.responses.length} evaluated response
              {report.responses.length === 1 ? '' : 's'} · Practice version{' '}
              {practiceVersion.version}
            </p>
          </div>
          <div className={styles.reportActions}>
            <ExportReportButton title={practiceVersion.snapshot.title} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/session/${report.session.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Session
              </Link>
            </Button>
          </div>
        </header>

        <section className={styles.summaryGrid}>
          <Card className={`${styles.scoreCard} shadow-sm`}>
            <CardHeader className="pb-3 text-center">
              <CardDescription>Overall score</CardDescription>
              <div className={`text-6xl font-bold tracking-tight ${scoreClass(score)}`}>
                {score}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                {scoreBand(score)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress value={score} />
              <p className="text-sm leading-6 text-muted-foreground">
                {sessionEvaluation.summary}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                Rubric performance
              </CardTitle>
              <CardDescription>
                Your performance across the criteria this Practice was designed to assess.
              </CardDescription>
            </CardHeader>
            <CardContent className={styles.rubricGrid}>
              {sessionEvaluation.criterionScores.map((criterion) => (
                <div
                  key={criterion.criterionId}
                  className="rounded-lg border bg-muted/10 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium">{criterion.criterionName}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {rubricWeightById.get(criterion.criterionId) ?? 0}% weight
                      </div>
                    </div>
                    <div className={`shrink-0 font-semibold ${scoreClass(criterion.score)}`}>
                      {Math.round(criterion.score)}
                    </div>
                  </div>
                  <Progress value={criterion.score} className="mt-3" />
                  <p className="mt-2.5 text-xs leading-5 text-muted-foreground">
                    {criterion.feedback}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className={styles.insightGrid}>
          <InsightCard
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
            title="What went well"
            items={sessionEvaluation.strengths}
          />
          <InsightCard
            icon={<TrendingUp className="h-5 w-5 text-amber-600" />}
            title="Focus next"
            items={sessionEvaluation.improvements}
          />
        </section>

        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Recommended next step
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 sm:text-base">
              {sessionEvaluation.recommendation}
            </p>
          </CardContent>
        </Card>

        <ScoringExplanation
          usesCurrentAggregation={usesCurrentAggregation}
          scoringRows={scoringRows}
          responseScores={report.responses.map(
            ({ evaluation }) => evaluation.overallScore,
          )}
          overallScore={sessionEvaluation.overallScore}
          evidenceWeight={evidenceWeight}
        />

        <section className="space-y-4 pt-1">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                Response review
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Review each answer, its score, and the rubric feedback behind it.
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              Latest attempt per question
            </div>
          </div>

          <div className="space-y-3">
            {report.responses.map(({ response, question, evaluation }, index) => {
              const mappedWeight = evaluation.criterionScores.reduce(
                (sum, criterion) =>
                  sum + (rubricWeightById.get(criterion.criterionId) ?? 0),
                0,
              );

              return (
                <Card key={response.id} className={styles.responseCard}>
                  <CardHeader className="pb-4">
                    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                      <div className="min-w-0">
                        <CardDescription>
                          Question {index + 1} · Attempt {response.attemptNumber}
                        </CardDescription>
                        <CardTitle className="mt-1 break-words text-lg leading-snug sm:text-xl">
                          {question.prompt}
                        </CardTitle>
                      </div>
                      <div className="flex min-w-[4.5rem] shrink-0 items-baseline gap-1 sm:block sm:text-right">
                        <div
                          className={`text-2xl font-bold ${scoreClass(evaluation.overallScore)}`}
                        >
                          {Math.round(evaluation.overallScore)}
                        </div>
                        <div className="text-xs text-muted-foreground">/100</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluation.summary && (
                      <div className="rounded-lg bg-muted/25 p-4">
                        <div className="text-sm font-medium">Feedback summary</div>
                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                          {evaluation.summary}
                        </p>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      {evaluation.criterionScores.map((criterion) => (
                        <div key={criterion.criterionId} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-2 text-sm">
                            <div className="min-w-0">
                              <span className="font-medium">
                                {criterion.criterionName}
                              </span>
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {rubricWeightById.get(criterion.criterionId) ?? 0}% weight
                              </div>
                            </div>
                            <span className={scoreClass(criterion.score)}>
                              {Math.round(criterion.score)}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            {criterion.feedback}
                          </p>
                        </div>
                      ))}
                    </div>

                    <details className="group rounded-lg border bg-background">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                        <span className="flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4 text-muted-foreground" />
                          Your response
                        </span>
                        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="border-t px-4 py-3">
                        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {response.transcript}
                        </p>
                      </div>
                    </details>

                    <p className="text-xs text-muted-foreground">
                      {evaluation.criterionScores.length} mapped criterion
                      {evaluation.criterionScores.length === 1 ? '' : 's'}
                      {mappedWeight > 0 ? ` · ${mappedWeight}% of published rubric represented` : ''}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

type ScoringRow = {
  criterion: EvaluationReport['sessionEvaluation']['criterionScores'][number];
  publishedWeight: number;
  effectiveWeight: number;
  contribution: number;
};

function ScoringExplanation({
  usesCurrentAggregation,
  scoringRows,
  responseScores,
  overallScore,
  evidenceWeight,
}: {
  usesCurrentAggregation: boolean;
  scoringRows: ScoringRow[];
  responseScores: number[];
  overallScore: number;
  evidenceWeight: number;
}) {
  return (
    <details className={`${styles.scoreDetails} group`}>
      <summary className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-md bg-muted p-2 text-muted-foreground">
            <Calculator className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium">How scoring works</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              View rubric weighting and score calculation details.
            </div>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t px-4 py-4 sm:px-5">
        <p className="text-sm leading-6 text-muted-foreground">
          {usesCurrentAggregation
            ? 'We average the evidence for each rubric criterion, then apply the published rubric weights. Criteria with no answered evidence are excluded and the remaining weights are normalized.'
            : 'This persisted report was created with the previous session aggregation model: its overall score is the average of the question scores. The rubric cards are still criterion averages. New reports use rubric-weighted session aggregation.'}
        </p>

        {usesCurrentAggregation ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {scoringRows.map((row) => (
                <div key={row.criterion.criterionId} className="rounded-lg border p-3">
                  <div className="text-sm font-medium">
                    {row.criterion.criterionName}
                  </div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">
                    {formatNumber(row.criterion.score)} score ×{' '}
                    {formatNumber(row.effectiveWeight)}% effective weight
                  </div>
                  <div className="mt-1 font-semibold">
                    {formatNumber(row.contribution)} points
                  </div>
                  {evidenceWeight !== 100 && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Published weight {formatNumber(row.publishedWeight)}%; normalized
                      because {formatNumber(evidenceWeight)}% of the rubric had answered
                      evidence.
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm">
              Weighted contributions ={' '}
              <span className="font-semibold">
                {formatNumber(overallScore)}/100
              </span>
              .
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-muted/30 px-4 py-3 text-sm leading-6">
            Question scores: {responseScores.map(formatNumber).join(' + ')}. Average ={' '}
            <span className="font-semibold">{formatNumber(overallScore)}/100</span>.
            The rubric weights shown above were used inside each question score, but
            this historical session did not apply them again at the final aggregation
            step.
          </div>
        )}
      </div>
    </details>
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
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

function ReportStep({
  number,
  title,
  description,
  complete = false,
}: {
  number: string;
  title: string;
  description: string;
  complete?: boolean;
}) {
  return (
    <div className="bg-background p-4 sm:p-5">
      <div
        className={`mb-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
          complete
            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        {complete ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>
      <div className="text-sm font-medium">{title}</div>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
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

function formatNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
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
