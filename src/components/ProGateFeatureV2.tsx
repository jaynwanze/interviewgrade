'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Crown, Lock, Sparkles, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
      <DialogContent className="sm:max-w-md overflow-hidden">
        {/* Animated gradient background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-yellow-100/50 via-orange-100/30 to-purple-100/50 dark:from-yellow-900/20 dark:via-orange-900/10 dark:to-purple-900/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <div className="relative z-10">
          <DialogHeader>
            <motion.div
              className="flex items-center gap-3 mb-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Crown className="h-6 w-6 text-white" />
              </motion.div>
              <div>
                <DialogTitle className="text-xl">Upgrade to Pro</DialogTitle>
                <span className="text-xs text-muted-foreground">
                  Unlock your full potential
                </span>
              </div>
            </motion.div>
            <DialogDescription className="pt-2 text-base">
              {description ||
                `Unlock ${feature} and many more premium features with Pro.`}
            </DialogDescription>
          </DialogHeader>

          <motion.div
            className="space-y-3 py-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {[
              'Unlimited practice & mock interviews',
              'Detailed rubric breakdown & feedback',
              'AI Coach chat assistance',
              'PDF report downloads',
              'Resume keyword analysis',
              'Custom interview builder',
            ].map((item, index) => (
              <motion.div
                key={item}
                className="flex items-center gap-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <Sparkles className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                <span>{item}</span>
              </motion.div>
            ))}
          </motion.div>

          <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Maybe Later
            </Button>
            <motion.div
              className="w-full sm:w-auto"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={() => {
                  onOpenChange(false);
                  router.push('/candidate/settings/billing');
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
              >
                <Zap className="mr-2 h-4 w-4" />
                Upgrade Now
              </Button>
            </motion.div>
          </DialogFooter>
        </div>
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
      <div className="opacity-50 pointer-events-none blur-[1px]">
        {children}
      </div>
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
