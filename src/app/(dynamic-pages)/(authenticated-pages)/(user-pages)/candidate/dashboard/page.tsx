import Link from 'next/link';
import { Library, Plus } from 'lucide-react';
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
  if (!progress) return null;

  return (
    <V2CandidateProgress
      summary={progress.summary}
      recentSessions={progress.recentSessions}
    />
  );
}

async function V2AnalyticsSection({ userId }: { userId: string }) {
  const analytics = await loadV2Analytics(userId);
  if (!analytics) return null;
  return <V2CandidateAnalytics analytics={analytics} />;
}

export default async function CandidateDashboardPage() {
  const user = await serverGetLoggedInUser();

  return (
    <main className="pb-8">
      <section className="container mx-auto w-full px-4 pt-5 sm:w-11/12 lg:w-3/4">
        <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your progress</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scores, momentum and recent Practice activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/candidate/practices/new">
                <Plus className="mr-1.5 h-4 w-4" />
                New practice
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/candidate/practices">
                <Library className="mr-1.5 h-4 w-4" />
                Practices
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={<DashboardSectionFallback />}>
        <V2ProgressSection userId={user.id} />
      </Suspense>

      <Suspense fallback={<DashboardSectionFallback />}>
        <V2AnalyticsSection userId={user.id} />
      </Suspense>
    </main>
  );
}

function DashboardSectionFallback() {
  return (
    <div className="container mx-auto w-full px-4 pt-3 sm:w-11/12 lg:w-3/4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-lg border bg-muted/25" />
        ))}
      </div>
    </div>
  );
}
