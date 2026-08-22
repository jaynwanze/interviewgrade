import Link from 'next/link';
import {
  BarChart3,
  ExternalLink,
  FileQuestion,
  Pencil,
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            InterviewGrade v2
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">My Practices</h1>
          <p className="max-w-2xl text-muted-foreground">
            Create, publish, share, and review results from reusable Practices.
          </p>
        </div>

        {result.ready && (
          <Button asChild>
            <Link href="/candidate/practices/new">
              <Plus className="mr-2 h-4 w-4" />
              Create practice
            </Link>
          </Button>
        )}
      </div>

      {created && result.ready && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-foreground">
          Practice draft created. It is saved in your personal workspace.
        </div>
      )}

      {!result.ready ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-xl">Practice creator setup pending</CardTitle>
            <CardDescription>
              The Practice service is not available in this environment right now.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : result.practices.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
              <FileQuestion className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-semibold">Create your first practice</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Generate with AI, upload source material, or build manually. Your
              first draft stays private until you publish it.
            </p>
            <Button asChild className="mt-6">
              <Link href="/candidate/practices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create practice
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.practices.map((practice) => (
            <PracticeCard key={practice.id} practice={practice} />
          ))}
        </div>
      )}
    </div>
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
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2 text-xl leading-snug">
            {practice.draft.title}
          </CardTitle>
          <span className="shrink-0 rounded-full border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground">
            {statusLabel}
          </span>
        </div>
        <CardDescription className="line-clamp-3">
          {practice.draft.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Questions" value={practice.draft.questions.length} />
          <Metric
            label="Criteria"
            value={practice.draft.rubricCriteria.length}
          />
        </div>
        <div className="border-t pt-4 text-xs text-muted-foreground">
          Updated {formatUpdatedAt(practice.updatedAt)}
        </div>
        <div className="grid gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href={`/candidate/practices/${practice.id}`}>
              <Pencil className="mr-2 h-4 w-4" />
              {practice.status === 'archived' ? 'View practice' : 'Edit practice'}
            </Link>
          </Button>

          {hasPublicLink && publicPath && (
            <>
              <Button asChild className="w-full">
                <Link href={`/candidate/practices/${practice.id}/results`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Results
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <CopyPracticeLinkButton path={publicPath} />
                <Button asChild variant="outline" className="w-full">
                  <Link href={publicPath} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/50 px-3 py-2">
      <div className="font-semibold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function formatUpdatedAt(value: Date): string {
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(value);
}
