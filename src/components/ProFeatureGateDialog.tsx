'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import { T, Typography } from './ui/Typography';
import { AspectRatio } from './ui/aspect-ratio';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { Crown, Lock, Sparkles, Check } from 'lucide-react';
import { PRO_FEATURES_DISPLAY } from '@/utils/checkAccess';

// Candidate upgrade prompt - controlled dialog (no built-in trigger)
interface UpgradePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  description?: string;
}

export function UpgradePrompt({
  open,
  onOpenChange,
  feature,
  description,
}: UpgradePromptProps) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-2 items-center hide-dialog-close sm:max-w-md">
        <AspectRatio
          ratio={16 / 9}
          className="rounded-lg overflow-hidden relative h-full"
        >
          <motion.div
            initial={{ scale: 5, filter: 'blur(5px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0 w-full h-full z-20 flex place-content-center"
          >
            <Image
              src="/assets/feature-pro-text.png"
              alt="Feature Pro"
              fill
              className="z-10"
            />
          </motion.div>
          <motion.div
            initial={{ scale: 2, filter: 'blur(2px)' }}
            animate={{ scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute inset-0 w-full h-full flex place-content-center"
          >
            <Image
              src="/assets/feature-pro.jpeg"
              alt="Feature Pro"
              fill
              className="z-10"
            />
          </motion.div>
        </AspectRatio>

        <div className="mt-4 flex gap-2.5 items-center justify-start">
          <Typography.H3 className="mt-0">Upgrade to</Typography.H3>
          <span className="px-2 text-sm text-primary-foreground rounded-md py-1 bg-primary flex place-content-center">
            PRO
          </span>
        </div>

        <Typography.P className="text-muted-foreground text-center">
          {description || `Unlock ${feature} and enjoy all our premium features.`}
        </Typography.P>

        {/* Pro Features List */}
        <div className="w-full space-y-2 my-4">
          {PRO_FEATURES_DISPLAY.map((item, index) => (
            <motion.div
              key={item}
              className="flex items-center gap-3 text-sm"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
            >
              <div className="p-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span>{item}</span>
            </motion.div>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={() => {
            onOpenChange(false);
            router.push('/candidate/settings/billing');
          }}
        >
          Upgrade to Pro
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// Badge to show on locked features
export function ProBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="outline"
      className={`bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900 dark:to-orange-900 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 ${className}`}
    >
      <Crown className="mr-1 h-3 w-3" />
      Pro
    </Badge>
  );
}

// Lock overlay for locked features
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
      <div className="opacity-50 pointer-events-none blur-[1px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Lock className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">{feature}</p>
        <Button
          size="sm"
          onClick={() => router.push('/candidate/settings/billing')}
          className="bg-gradient-to-r from-yellow-500 to-orange-500"
        >
          <Crown className="mr-1 h-3 w-3" />
          Unlock with Pro
        </Button>
      </div>
    </div>
  );
}