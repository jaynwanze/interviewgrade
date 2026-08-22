import Link from 'next/link';
import { History, Library, Plus } from 'lucide-react';
import { Suspense } from 'react';

import { Button } from '@/components/ui/button';
import type { CandidatePracticeAnalytics } from '@/modules/analytics/candidate-practice-analytics';
import type { CandidateDashboardProgress } from '@/modules/analytics/candidate-dashboard-progress';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

import { V2CandidateAnalytics } from './V2CandidateAnalytics';
import { V2CandidateProgress } from './V2CandidateProgress';

async function loadV2Progress(
  userId: string,
): Promise<CandidateDashboardProgress | null> {
  try {
    const { getCandidateDashboardProgress } = await import(
      '@/modules/analytics/candidate-dashboard-progress'
    );
    return await getCandidateDashboardProgress(userId);
  } catch (error) {
    console.error('CandidateDashboard: v2 progress unavailable', error);
    return null;
  }
}

async function loadV2Analytics(
  userId: string,
): Promise<CandidatePracticeAnalytics | null> {
  try {
    const { getCandidatePracticeAnalytics } = await import(
      '@/modules/analytics/candidate-practice-analytics'
    );
    return await getCandidatePracticeAnalytics(userId);
  } catch (error) {
    console.error('CandidateDashboard: v2 analytics unavailable', error);
    return null;
  }
}

async function V2ProgressSection({ userId }: { userId: string }) {
  const progress = await loadV2Progress(userId);
  if (!progress) {
    return null;
  }

  return (
    <V2CandidateProgress
      summary={progress.summary}
      recentSessions={progress.recentSessions}
    />
  );
}

async function V2AnalyticsSection({ userId }: { userId: string }) {
  const analytics = await loadV2Analytics(userId);
  if (!analytics) {
    return null;
  }

  return <V2CandidateAnalytics analytics={analytics} />;
}

export default async function CandidateDashboardPage() {
  const user = await serverGetLoggedInUser();

  return (
    <main className="pb-10">
      <section className="container mx-auto w-3/4 px-4 pt-6">
        <div className="flex flex-col gap-4 border-b pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Your progress</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track your Practice sessions, rubric performance, and improvement over
              time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/candidate/practices/new">
                <Plus className="mr-2 h-4 w-4" />
                Create practice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/candidate/practices">
                <Library className="mr-2 h-4 w-4" />
                My practices
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/candidate/interview-history">
                <History className="mr-2 h-4 w-4" />
                View history
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={<DashboardSectionFallback label="Loading progress…" />}>
        <V2ProgressSection userId={user.id} />
      </Suspense>

      <Suspense fallback={<DashboardSectionFallback label="Loading analytics…" />}>
        <V2AnalyticsSection userId={user.id} />
      </Suspense>
    </main>
  );
}

function DashboardSectionFallback({ label }: { label: string }) {
  return (
    <div className="container mx-auto w-3/4 px-4 pt-4">
      <div className="h-24 animate-pulse rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
