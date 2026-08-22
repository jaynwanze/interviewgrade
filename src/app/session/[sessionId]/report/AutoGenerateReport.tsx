'use client';

import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function AutoGenerateReport({
  generateAction,
}: {
  generateAction: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={generateAction}>
      <button type="submit" className="sr-only" tabIndex={-1}>
        Generate report
      </button>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div>
          <div className="font-medium">Generating your final report…</div>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Your Practice is complete and your responses are saved. InterviewGrade is
            now assembling your rubric-based report.
          </p>
        </div>
      </div>
    </form>
  );
}
