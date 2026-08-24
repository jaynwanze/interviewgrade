'use client';

import { registerPendingPracticeReport } from '@/components/ReportReadyWatcher';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export function AutoGenerateReport({
  sessionId,
  homeHref,
  homeLabel,
}: {
  sessionId: string;
  homeHref: string;
  homeLabel: string;
}) {
  const router = useRouter();
  const mountedRef = useRef(true);
  const requestedRef = useRef(false);
  const [generationStarted, setGenerationStarted] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);

  const startGeneration = useCallback(async () => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    setGenerationStarted(true);
    setGenerationFailed(false);
    registerPendingPracticeReport(sessionId);

    try {
      const response = await fetch('/api/v2/practice-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      });

      if (!response.ok) {
        throw new Error(`Report generation returned ${response.status}.`);
      }

      const result = (await response.json()) as { status?: string };
      if (result.status !== 'ready') {
        throw new Error('Report generation did not complete.');
      }

      if (mountedRef.current) {
        router.replace(`/session/${encodeURIComponent(sessionId)}/report`);
      }
    } catch (error) {
      console.error('AutoGenerateReport: report generation failed', error);
      if (mountedRef.current) setGenerationFailed(true);
    } finally {
      requestedRef.current = false;
    }
  }, [router, sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    void startGeneration();
    return () => {
      mountedRef.current = false;
    };
  }, [startGeneration]);

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div>
        <div className="font-medium">
          {generationFailed ? 'Your report is still being prepared' : 'Generating your final report…'}
        </div>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {generationFailed
            ? 'Your responses are saved safely. You can retry here, or leave and come back from your notifications or History.'
            : 'Your responses are saved. You can stay here and we’ll open the report automatically, or leave now and InterviewGrade will let you know when it’s ready.'}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild className="w-full sm:w-auto" disabled={!generationStarted}>
          <Link href={homeHref}>{homeLabel}</Link>
        </Button>
        {generationFailed && (
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => void startGeneration()}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry report
          </Button>
        )}
      </div>

      {!generationFailed && (
        <p className="text-xs text-muted-foreground">
          Stay on this page if you want the report to open automatically when it finishes.
        </p>
      )}
    </div>
  );
}
