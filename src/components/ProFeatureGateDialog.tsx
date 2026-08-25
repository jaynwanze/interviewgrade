'use client';

import { Check, Crown, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { pricing } from '@/data/anon/pricing';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  description?: string;
}

const proPlan = pricing.find((plan) => plan.title === 'Pro');

export function UpgradePrompt({
  open,
  onOpenChange,
  feature,
  description,
}: UpgradePromptProps) {
  const router = useRouter();
  void feature;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-left">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>More Practice with Pro</DialogTitle>
              <div className="mt-0.5 text-sm font-medium text-primary">
                €{proPlan?.price ?? '9.99'} / month
              </div>
            </div>
          </div>
          <DialogDescription className="leading-6">
            {description ||
              'Move from 3 to 30 monthly AI Practice runs and from 3 to 30 AI-created Practices.'}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 rounded-xl border bg-muted/15 p-4">
          <div className="text-sm font-medium">Pro includes</div>
          <div className="mt-3 space-y-2.5">
            {(proPlan?.features ?? []).map((item) => (
              <div key={item} className="flex items-start gap-2.5 text-sm">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Free still includes rubric-based feedback, final reports, and unlimited manual Practice creation and editing.
        </p>

        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Keep Free
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              router.push('/candidate/settings/billing');
            }}
          >
            View Pro plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge variant="outline" className={className}>
      <Crown className="mr-1 h-3 w-3" />
      Pro
    </Badge>
  );
}

export function LockedFeature({
  children,
  feature,
}: {
  children: React.ReactNode;
  feature: string;
}) {
  const router = useRouter();

  return (
    <div className="relative">
      <div className="pointer-events-none opacity-50 blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-background/85 p-4 text-center backdrop-blur-sm">
        <Lock className="mb-2 h-6 w-6 text-muted-foreground" />
        <p className="mb-3 text-sm text-muted-foreground">{feature}</p>
        <Button size="sm" onClick={() => router.push('/candidate/settings/billing')}>
          <Crown className="mr-1.5 h-3.5 w-3.5" />
          View Pro plan
        </Button>
      </div>
    </div>
  );
}
