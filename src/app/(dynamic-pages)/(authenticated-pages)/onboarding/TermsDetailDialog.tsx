// TermsDetailDialog.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

type Props = {
  userType: 'candidate' | 'employer';
  onConfirm: () => void;
  isLoading: boolean;
};

export function TermsDetailDialog({ userType, onConfirm, isLoading }: Props) {
  const [md, setMd] = useState<string | null>(null);

  useEffect(() => {
    const path =
      userType === 'candidate'
        ? '/legal/candidate-tos.md'
        : '/legal/employer-tos.md';

    fetch(path)
      .then((r) => r.text())
      .then(setMd)
      .catch(() => setMd('# Error loading terms '));
  }, [userType]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">View Terms</Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[88svh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-4 p-4 sm:w-full sm:p-6">
        <DialogHeader className="shrink-0 pr-6">
          <DialogTitle className="text-lg sm:text-xl">Terms of Service</DialogTitle>
        </DialogHeader>

        {!md ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="prose prose-sm min-h-0 max-w-none flex-1 overflow-y-auto pr-2 text-foreground dark:prose-invert prose-headings:scroll-mt-4 prose-h1:text-2xl prose-h2:text-lg sm:prose-base sm:prose-h1:text-3xl sm:prose-h2:text-xl">
            <ReactMarkdown>{md}</ReactMarkdown>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? 'Accepting…' : 'Accept Terms'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
