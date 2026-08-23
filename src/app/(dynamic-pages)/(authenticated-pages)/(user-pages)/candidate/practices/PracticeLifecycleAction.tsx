'use client';

import { Loader2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { PracticeStatus } from '@/modules/practice/practice.schema';

import { retirePracticeAction } from './actions';

type PracticeLifecycleActionProps = {
  practiceId: string;
  title: string;
  status: PracticeStatus;
};

export function PracticeLifecycleAction({
  practiceId,
  title,
  status,
}: PracticeLifecycleActionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDraft = status === 'draft';

  async function handleRetire() {
    if (pending) return;

    setPending(true);
    setError(null);

    try {
      const result = await retirePracticeAction(practiceId);
      if (!result.success) {
        setError(result.message);
        return;
      }

      setOpen(false);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          setOpen(nextOpen);
          if (!nextOpen) setError(null);
        }
      }}
    >
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`${isDraft ? 'Delete' : 'Archive'} ${title}`}
          title={isDraft ? 'Delete Practice' : 'Archive Practice'}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDraft ? 'Delete this Practice?' : 'Archive this Practice?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDraft
              ? 'Unused drafts are permanently deleted. If this Practice has any published or participant history, InterviewGrade will archive it instead so historical results remain safe.'
              : 'This stops the public share link from accepting new sessions and removes the Practice from My Practices. Existing Results and participant reports remain available.'}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm font-medium">
          {title}
        </div>

        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={pending}
            onClick={(event) => {
              event.preventDefault();
              void handleRetire();
            }}
          >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDraft ? 'Delete Practice' : 'Archive Practice'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
