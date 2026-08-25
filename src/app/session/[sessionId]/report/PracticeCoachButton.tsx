'use client';

import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { PracticeCoachCard } from './PracticeCoachCard';

export function PracticeCoachButton() {
  const pathname = usePathname();
  const sessionId = useMemo(() => {
    const match = pathname.match(/^\/session\/([^/]+)\/report$/);
    return match?.[1] ?? null;
  }, [pathname]);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    const controller = new AbortController();
    void fetch(`/api/v2/practice-coach?sessionId=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
      cache: 'no-store',
    })
      .then(async (response) => {
        if (!response.ok) return { available: false };
        return (await response.json()) as { available?: boolean };
      })
      .then((result) => setAvailable(result.available === true))
      .catch(() => setAvailable(false));

    return () => controller.abort();
  }, [sessionId]);

  if (!sessionId || !available) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" size="sm">
          <Sparkles className="mr-2 h-4 w-4" />
          Ask Coach
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-2xl overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>AI Coach</DialogTitle>
        </DialogHeader>
        <PracticeCoachCard sessionId={sessionId} />
      </DialogContent>
    </Dialog>
  );
}
