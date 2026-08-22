import { Clock3, ListChecks, ShieldCheck, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Practice } from '@/modules/practice/practice.schema';

import { startPublicPracticeSessionAction } from './actions';

type PublicPracticePageProps = {
  params: { slug: string };
  searchParams?: { error?: string };
};

type PublicPracticeLoadResult =
  | { state: 'ready'; practice: Practice }
  | { state: 'not-found' }
  | { state: 'unavailable' };

async function loadPublishedPractice(slug: string): Promise<PublicPracticeLoadResult> {
  try {
    const { getPublishedPracticeBySlug } = await import(
      '@/modules/practice/practice.service'
    );
    const practice = await getPublishedPracticeBySlug(slug);

    return practice ? { state: 'ready', practice } : { state: 'not-found' };
  } catch (error) {
    console.error('PublicPracticePage: v2 practice persistence unavailable', error);
    return { state: 'unavailable' };
  }
}

export async function generateMetadata({
  params,
}: PublicPracticePageProps): Promise<Metadata> {
  const result = await loadPublishedPractice(params.slug);

  if (result.state !== 'ready') {
    return { title: 'Practice | InterviewGrade' };
  }

  return {
    title: `${result.practice.draft.title} | InterviewGrade`,
    description: result.practice.draft.description,
  };
}

export default async function PublicPracticePage({
  params,
  searchParams,
}: PublicPracticePageProps) {
  const result = await loadPublishedPractice(params.slug);

  if (result.state === 'unavailable') {
    return <PublicSetupUnavailable />;
  }

  if (result.state === 'not-found') {
    return <PracticeNotFound />;
  }

  const { practice } = result;
  const startAction = startPublicPracticeSessionAction.bind(null, params.slug);
  const detailsError = searchParams?.error === 'details';
  const unavailableError = searchParams?.error === 'unavailable';

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold tracking-tight">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            InterviewGrade
          </div>
          <span className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            Shared practice
          </span>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <section className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  {practice.draft.title}
                </h1>
                <p className="max-w-3xl text-lg text-muted-foreground">
                  {practice.draft.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                {practice.draft.difficulty && (
                  <span className="rounded-full border bg-background px-3 py-1">
                    {practice.draft.difficulty}
                  </span>
                )}
                {practice.draft.estimatedDurationMinutes && (
                  <span className="inline-flex items-center rounded-full border bg-background px-3 py-1">
                    <Clock3 className="mr-1.5 h-3.5 w-3.5" />
                    About {practice.draft.estimatedDurationMinutes} min
                  </span>
                )}
                <span className="inline-flex items-center rounded-full border bg-background px-3 py-1">
                  <ListChecks className="mr-1.5 h-3.5 w-3.5" />
                  {practice.draft.questions.length}{' '}
                  {practice.draft.questions.length === 1 ? 'question' : 'questions'}
                </span>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Scenario</CardTitle>
                <CardDescription>
                  The context you will use throughout this practice.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap leading-7 text-foreground/90">
                  {practice.draft.scenario}
                </p>
              </CardContent>
            </Card>

            {practice.draft.instructions && (
              <Card>
                <CardHeader>
                  <CardTitle>Before you begin</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap leading-7 text-foreground/90">
                    {practice.draft.instructions}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>What you’ll be assessed on</CardTitle>
                <CardDescription>
                  Feedback will be grounded in this published scoring rubric.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {practice.draft.rubricCriteria.map((criterion) => (
                  <div
                    key={criterion.id ?? `${criterion.order}-${criterion.name}`}
                    className="flex items-start justify-between gap-4 rounded-lg border bg-muted/20 p-4"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{criterion.name}</div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {criterion.description}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {criterion.weight}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          <aside className="lg:sticky lg:top-8">
            <Card className="shadow-md">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle>Ready to practise?</CardTitle>
                <CardDescription>
                  Start as a guest. Your name and email are optional. Your Practice
                  result will be visible to the creator.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {detailsError && (
                  <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    Check the optional email address and try again.
                  </div>
                )}

                {unavailableError && (
                  <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                    This practice cannot start right now. Please try again later.
                  </div>
                )}

                <form action={startAction} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input id="name" name="name" maxLength={160} autoComplete="name" />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      maxLength={320}
                      autoComplete="email"
                    />
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    Start practice
                  </Button>

                  <p className="text-center text-xs leading-5 text-muted-foreground">
                    If you provide a name or email, those details and your result can
                    be reviewed by the Practice creator. Your session is pinned to
                    this published version so its questions cannot change after you
                    start.
                  </p>
                </form>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

function PracticeNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg border-dashed text-center">
        <CardHeader>
          <CardTitle>Practice not available</CardTitle>
          <CardDescription>
            This link does not point to a currently published InterviewGrade practice.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}

function PublicSetupUnavailable() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-lg border-dashed text-center">
        <CardHeader>
          <CardTitle>Practice temporarily unavailable</CardTitle>
          <CardDescription>
            The practice service is not available in this environment right now.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
