'use client';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ExportReportButton({ title }: { title: string }) {
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
