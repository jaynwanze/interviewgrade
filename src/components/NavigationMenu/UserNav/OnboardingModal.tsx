'use client';

import Link from 'next/link';
import { ReactNode, useState } from 'react';
import { ArrowRight, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/utils/cn';

type OnboardingFeature = {
  title: string;
  description: ReactNode;
  href?: string;
  actionLabel?: string;
};

export function OnboardingModal({
  featureList,
  className,
  children,
}: {
  featureList: OnboardingFeature[];
  children?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild className={cn('w-full', className)}>
        {children ? (
          children
        ) : (
          <Button variant="secondary" className="flex items-center gap-2 rounded-sm py-2 text-sm">
            <HelpCircle className="h-4 w-4" />
            Help
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto p-5 sm:max-w-2xl sm:p-6">
        <DialogHeader className="text-left">
          <DialogTitle>Using InterviewGrade</DialogTitle>
          <DialogDescription>
            The quickest ways to create, practise, review feedback, and manage your plan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2 sm:grid-cols-2">
          {featureList.map((feature) => (
            <div key={feature.title} className="flex flex-col rounded-xl border bg-muted/10 p-4">
              <div className="font-medium">{feature.title}</div>
              <div className="mt-1 flex-1 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </div>
              {feature.href && (
                <Button asChild variant="ghost" size="sm" className="mt-3 h-8 justify-start px-0">
                  <Link href={feature.href} onClick={() => setOpen(false)}>
                    {feature.actionLabel ?? 'Open'}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
