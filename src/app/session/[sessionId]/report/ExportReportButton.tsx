'use client';

import { Download } from 'lucide-react';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export function ExportReportButton({ title }: { title: string }) {
  useEffect(() => {
    const originalTitle = document.title;
    let notification: Notification | null = null;

    if (document.visibilityState === 'hidden') {
      document.title = 'Report ready · InterviewGrade';

      if ('Notification' in window && Notification.permission === 'granted') {
        notification = new Notification('Your InterviewGrade report is ready', {
          body: title,
          tag: 'interviewgrade-report-ready',
        });
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        document.title = originalTitle;
        notification?.close();
        notification = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      notification?.close();
      if (document.title === 'Report ready · InterviewGrade') {
        document.title = originalTitle;
      }
    };
  }, [title]);

  const exportReport = () => {
    const previousTitle = document.title;
    document.title = `${title} - InterviewGrade report`;

    window.print();

    window.setTimeout(() => {
      document.title = previousTitle;
    }, 250);
  };

  return (
    <Button type="button" variant="outline" size="sm" onClick={exportReport}>
      <Download className="mr-2 h-4 w-4" />
      Export PDF
    </Button>
  );
}
