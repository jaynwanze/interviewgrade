'use client';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';

interface UsageDisplayProps {
  label: string;
  used: number;
  limit: number;
  isPro: boolean;
}

export function UsageDisplay({ label, used, limit, isPro }: UsageDisplayProps) {
  if (isPro) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>{label}:</span>
        <Badge variant="outline" className="text-green-600 border-green-600">
          <Crown className="mr-1 h-3 w-3" />
          Unlimited
        </Badge>
      </div>
    );
  }

  const percentage = Math.min(100, (used / limit) * 100);
  const remaining = Math.max(0, limit - used);
  const isNearLimit = percentage >= 80;
  const isAtLimit = remaining === 0;

  return (
    <div className="space-y-1 w-40 sm:w-60 transition-all duration-300">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={isAtLimit ? 'text-red-500 font-medium' : ''}>
          {used} / {limit} used
        </span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isAtLimit ? '[&>div]:bg-red-500' : isNearLimit ? '[&>div]:bg-yellow-500' : ''}`}
      />
      {isAtLimit && (
        <p className="text-xs text-red-500">
          You've reached your monthly limit. Upgrade to Pro for unlimited
          access.
        </p>
      )}
    </div>
  );
}
