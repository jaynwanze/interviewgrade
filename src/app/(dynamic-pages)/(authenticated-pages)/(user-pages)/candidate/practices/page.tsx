import Link from 'next/link';
import {
  BarChart3,
  Clock3,
  FileQuestion,
  ListChecks,
  Pencil,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Practice } from '@/modules/practice/practice.schema';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import { CopyPracticeLinkButton } from './CopyPracticeLinkButton';
import { PracticeLifecycleAction } from './PracticeLifecycleAction';

type MyPracticesPageProps = {
  searchParams?: {
    created?: string;
  };
};

type PracticeLoadResult =
  | { ready: true; practices: Practice[] }
  | { ready: false; practices: [] };

async function loadMyPractices(): Promise<PracticeLoadResult> {
  await serverGetLoggedInUser();

  try {
    const { createAuthenticatedPracticeService } = await import(
      '@/modules/practice/practice.service'
    );
    const service = await createAuthenticatedPracticeService();
    const practices = await service.listMine();

    return { ready: true, practices };
  } catch (error) {
    console.error('MyPracticesPage: v2 practice persistence unavailable', error);
    return { ready: false, practices: [] };
  }
}

export default async function MyPracticesPage({
  searchParams,
}: MyPracticesPageProps) {
  const result = await loadMyPractices();
  const created = searchParams?.created === '1';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Practice workspace
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">My Practices</h1>
          <p className="text-sm text-muted-foreground">
            Create, run, share and review your Practices.
          </p>
        </div>

        {result.ready && (
          <Button asChild size="lg" className="w-full shadow-sm sm:w-auto">
            <Link href="/candidate/practices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create practice
            </Link>
          </Button>
        )}
      </div>

      {created && result.ready && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground">
          Practice created and saved as a private draft.
        </div>
      )}

      {!result.ready ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
            <div className="mb-3 rounded-full bg-muted p-3 text-muted-foreground">
              <FileQuestion className="h-6 w-6" />
            </div>
            <h2 className="font-semibold">Practices are temporarily unavailable</h2>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Refresh to try loading your Practice workspace again.
            </p>
          </CardContent>
        </Card>
      ) : result.practices.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <FileQuestion className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">Create your first practice</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Start with AI, source material, or a blank Practice. It stays private
              until you publish it.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/candidate/practices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create practice
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <CreatePracticeCard />
          {result.practices.map((practice) => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      )}
    </div>
  );
}

function CreatePracticeCard() {
  return (
    <Card className="group flex min-h-[292px] border-dashed bg-primary/[0.025] transition-colors hover:border-primary/40 hover:bg-primary/[0.045]">
      <CardContent className="flex w-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary transition-transform group-hover:scale-105">
          <Plus className="h-6 w-6" />
        </div>
        <div className="font-semibold">Create a new practice</div>
        <p className="mt-1 max-w-[220px] text-sm text-muted-foreground">
          Create with AI, upload a document, or start manually.
        </p>
        <Button asChild className="mt-5">
          <Link href="/candidate/practices/new">Create practice</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PracticeCard({ practice }: { practice: Practice }) {
  const statusLabel =
    practice.status === 'published'
      ? 'Published'
      : practice.status === 'archived'
        ? 'Archived'
        : 'Draft';
  const hasPublicLink =
    practice.status === 'published' && Boolean(practice.shareSlug);
  const publicPath = practice.shareSlug ? `/p/${practice.shareSlug}` : null;

  return (
    <Card
      data-testid={`practice-card-${practice.id}`}
      className="flex min-h-[292px] flex-col overflow-hidden transition-shadow hover:shadow-md"
    >
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusPill status={practice.status} label={statusLabel} />
              {practice.draft.difficulty && (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                  {practice.draft.difficulty}
                </span>
              )}
            </div>
            <CardTitle className="line-clamp-2 text-lg leading-snug">
              {practice.draft.title}
            </CardTitle>
          </div>
          <PracticeLifecycleAction
            practiceId={practice.id}
            title={practice.draft.title}
            status={practice.status}
          />
        </div>
        <CardDescription className="line-clamp-2 min-h-10 text-sm leading-5">
          {practice.draft.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-auto space-y-4 pt-0">
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <Meta icon={<ListChecks className="h-3.5 w-3.5" />}>
            {practice.draft.questions.length} questions
          </Meta>
          <Meta icon={<FileQuestion className="h-3.5 w-3.5" />}>
            {practice.draft.rubricCriteria.length} criteria
          </Meta>
          {practice.draft.estimatedDurationMinutes && (
            <Meta icon={<Clock3 className="h-3.5 w-3.5" />}>
              {practice.draft.estimatedDurationMinutes} min
            </Meta>
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>Updated {formatUpdatedAt(practice.updatedAt)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/candidate/practices/${practice.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {practice.status === 'archived' ? 'View' : 'Edit'}
            </Link>
          </Button>

          {hasPublicLink && publicPath ? (
            <Button asChild size="sm" className="w-full">
              <Link href={publicPath} target="_blank">
                <Play className="mr-2 h-4 w-4" />
                Run
              </Link>
            </Button>
          ) : (
            <Button size="sm" className="w-full" disabled>
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          )}

          {hasPublicLink && publicPath && (
            <>
              <CopyPracticeLinkButton path={publicPath} />
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href={`/candidate/practices/${practice.id}/results`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Results
                </Link>
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: Practice['status'];
  label: string;
}) {
  const className =
    status === 'published'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'archived'
        ? 'border-muted-foreground/20 bg-muted text-muted-foreground'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function formatUpdatedAt(value: Date): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}
