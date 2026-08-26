import Link from 'next/link';
import {
  BarChart3,
  Clock3,
  FileQuestion,
  ListChecks,
  Pencil,
  Play,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Practice } from '@/modules/practice/practice.schema';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import { CopyPracticeLinkButton } from './CopyPracticeLinkButton';
import { PracticeLifecycleAction } from './PracticeLifecycleAction';

type MyPracticesPageProps = {
  searchParams?: { created?: string };
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
    return { ready: true, practices: await service.listMine() };
  } catch (error) {
    console.error('MyPracticesPage: v2 practice persistence unavailable', error);
    return { ready: false, practices: [] };
  }
}

export default async function MyPracticesPage({ searchParams }: MyPracticesPageProps) {
  const result = await loadMyPractices();
  const created = searchParams?.created === '1';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">My Practices</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Build, run and review interview practice.
          </p>
        </div>
        {result.ready && (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/candidate/practices/new">
              <Plus className="mr-1.5 h-4 w-4" />
              New
            </Link>
          </Button>
        )}
      </div>

      {created && result.ready && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm">
          Practice saved as a private draft.
        </div>
      )}

      {!result.ready ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-44 flex-col items-center justify-center p-6 text-center">
            <FileQuestion className="mb-2 h-6 w-6 text-muted-foreground" />
            <div className="font-semibold">Practices unavailable</div>
            <div className="mt-1 text-sm text-muted-foreground">Refresh to try again.</div>
          </CardContent>
        </Card>
      ) : result.practices.length === 0 ? (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex min-h-52 flex-col items-center justify-center p-6 text-center">
            <FileQuestion className="mb-3 h-7 w-7 text-primary" />
            <h2 className="text-lg font-semibold">Create your first practice</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Start with AI, a document, or a blank draft.
            </p>
            <Button asChild className="mt-4">
              <Link href="/candidate/practices/new">Create practice</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
    <Card className="group flex min-h-[220px] border-dashed bg-primary/[0.02] transition-colors hover:border-primary/40">
      <CardContent className="flex w-full flex-col items-center justify-center p-5 text-center">
        <div className="mb-3 rounded-full bg-primary/10 p-3 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <div className="font-semibold">New practice</div>
        <p className="mt-1 text-xs text-muted-foreground">AI, document, or manual.</p>
        <Button asChild size="sm" className="mt-4">
          <Link href="/candidate/practices/new">Create</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function PracticeCard({ practice }: { practice: Practice }) {
  const statusLabel =
    practice.status === 'published' ? 'Published' : practice.status === 'archived' ? 'Archived' : 'Draft';
  const hasPublicLink = practice.status === 'published' && Boolean(practice.shareSlug);
  const publicPath = practice.shareSlug ? `/p/${practice.shareSlug}` : null;

  return (
    <Card data-testid={`practice-card-${practice.id}`} className="flex min-h-[220px] flex-col overflow-hidden">
      <CardHeader className="space-y-2 p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <StatusPill status={practice.status} label={statusLabel} />
              {practice.draft.difficulty && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                  {practice.draft.difficulty}
                </span>
              )}
            </div>
            <CardTitle className="line-clamp-2 text-base leading-snug">
              {practice.draft.title}
            </CardTitle>
          </div>
          <PracticeLifecycleAction
            practiceId={practice.id}
            title={practice.draft.title}
            status={practice.status}
          />
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-3 p-4 pt-2">
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <Meta icon={<ListChecks className="h-3.5 w-3.5" />}>{practice.draft.questions.length}</Meta>
          <Meta icon={<FileQuestion className="h-3.5 w-3.5" />}>{practice.draft.rubricCriteria.length}</Meta>
          {practice.draft.estimatedDurationMinutes && (
            <Meta icon={<Clock3 className="h-3.5 w-3.5" />}>{practice.draft.estimatedDurationMinutes} min</Meta>
          )}
          <span className="ml-auto text-[11px]">{formatUpdatedAt(practice.updatedAt)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/candidate/practices/${practice.id}`}>
              <Pencil className="mr-1.5 h-4 w-4" />
              {practice.status === 'archived' ? 'View' : 'Edit'}
            </Link>
          </Button>
          {hasPublicLink && publicPath ? (
            <Button asChild size="sm">
              <Link href={publicPath} target="_blank">
                <Play className="mr-1.5 h-4 w-4" />
                Run
              </Link>
            </Button>
          ) : (
            <Button size="sm" disabled>
              <Play className="mr-1.5 h-4 w-4" />
              Run
            </Button>
          )}
          {hasPublicLink && publicPath && (
            <>
              <CopyPracticeLinkButton path={publicPath} />
              <Button asChild variant="outline" size="sm">
                <Link href={`/candidate/practices/${practice.id}/results`}>
                  <BarChart3 className="mr-1.5 h-4 w-4" />
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

function Meta({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1">{icon}{children}</span>;
}

function StatusPill({ status, label }: { status: Practice['status']; label: string }) {
  const className =
    status === 'published'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
      : status === 'archived'
        ? 'border-muted-foreground/20 bg-muted text-muted-foreground'
        : 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300';

  return <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}>{label}</span>;
}

function formatUpdatedAt(value: Date): string {
  return new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' }).format(value);
}
