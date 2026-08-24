'use client';

import { useNotifications } from '@/contexts/NotificationsContext';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export const PENDING_REPORTS_STORAGE_KEY = 'interviewgrade:pending-practice-reports';

function readPendingReportIds(): string[] {
  try {
    const raw = window.localStorage.getItem(PENDING_REPORTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === 'string');
  } catch {
    return [];
  }
}

function writePendingReportIds(ids: string[]) {
  window.localStorage.setItem(
    PENDING_REPORTS_STORAGE_KEY,
    JSON.stringify(Array.from(new Set(ids))),
  );
}

export function registerPendingPracticeReport(sessionId: string) {
  if (typeof window === 'undefined') return;
  const ids = readPendingReportIds();
  if (!ids.includes(sessionId)) {
    writePendingReportIds([...ids, sessionId]);
  }
}

export function ReportReadyWatcher() {
  const router = useRouter();
  const { addNotification } = useNotifications();
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;

    const checkPendingReports = async () => {
      const pendingIds = readPendingReportIds();
      if (pendingIds.length === 0) return;

      const remaining: string[] = [];

      for (const sessionId of pendingIds) {
        try {
          const response = await fetch(
            `/api/v2/practice-report?sessionId=${encodeURIComponent(sessionId)}`,
            { cache: 'no-store' },
          );
          if (!response.ok) {
            remaining.push(sessionId);
            continue;
          }

          const result = (await response.json()) as { status?: string };
          if (result.status !== 'ready') {
            remaining.push(sessionId);
            continue;
          }

          if (cancelled || notifiedRef.current.has(sessionId)) continue;
          notifiedRef.current.add(sessionId);

          const reportPath = `/session/${encodeURIComponent(sessionId)}/report`;
          addNotification({
            title: 'Practice report ready',
            message: 'Your rubric-based coaching report is ready to review.',
            link: reportPath,
          });
          toast.success('Your Practice report is ready', {
            action: {
              label: 'View',
              onClick: () => router.push(reportPath),
            },
          });

          if (document.visibilityState === 'hidden') {
            document.title = 'Report ready · InterviewGrade';
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Your InterviewGrade report is ready', {
                body: 'Open InterviewGrade to review your Practice feedback.',
              });
            }
          }
        } catch {
          remaining.push(sessionId);
        }
      }

      if (!cancelled) writePendingReportIds(remaining);
    };

    void checkPendingReports();
    const intervalId = window.setInterval(() => void checkPendingReports(), 5000);

    const restoreTitle = () => {
      if (
        document.visibilityState === 'visible' &&
        document.title === 'Report ready · InterviewGrade'
      ) {
        document.title = 'InterviewGrade';
      }
    };
    document.addEventListener('visibilitychange', restoreTitle);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', restoreTitle);
    };
  }, [addNotification, router]);

  return null;
}
