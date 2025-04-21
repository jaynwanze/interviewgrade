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
      .catch(() => setMd('# Error loading terms '));
  }, [userType]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">View Terms</Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg mb-4">Terms & Conditions</DialogTitle>
        </DialogHeader>

        {!md ? (
          <Skeleton className="w-full h-40" />
        ) : (
          <div className="prose max-h-[60vh] overflow-auto">
            <ReactMarkdown>{md}</ReactMarkdown>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onConfirm} disabled={isLoading} className="w-full">
            {isLoading ? 'Accepting…' : 'Accept Terms'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
