'use client';

import { ArrowRight, Briefcase, PlayCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Table } from '@/types';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';

import { ProfileUpdate } from './OnboardingFlow';
import { V2TermsAcceptance } from './V2TermsAcceptance';
import {
  completeV2OnboardingAction,
  type V2ExperienceLevel,
  type V2InterviewFocus,
  type V2OnboardingFirstAction,
} from './actions';

type Step = 'terms' | 'profile' | 'target';

const experienceOptions: Array<{ value: V2ExperienceLevel; label: string }> = [
  { value: 'intern', label: 'Intern' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'mid', label: 'Mid-level' },
  { value: 'senior', label: 'Senior' },
];

const focusOptions: Array<{ value: V2InterviewFocus; label: string }> = [
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'role-specific', label: 'Role-specific' },
  { value: 'technical', label: 'Technical' },
  { value: 'mixed', label: 'Mixed' },
];

export function V2OnboardingFlow({
  userProfile,
  onboardingStatus,
  userEmail,
}: {
  userProfile: Table<'user_profiles'>;
  onboardingStatus: AuthUserMetadata;
  userEmail: string | undefined;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initialStep = useMemo<Step>(() => {
    if (!onboardingStatus.onboardingHasAcceptedTerms) return 'terms';
    if (!onboardingStatus.onboardingHasCompletedProfile) return 'profile';
    return 'target';
  }, [onboardingStatus]);
  const [step, setStep] = useState<Step>(initialStep);
  const [targetRole, setTargetRole] = useState(
    onboardingStatus.practiceTargetRole ?? '',
  );
  const [experienceLevel, setExperienceLevel] =
    useState<V2ExperienceLevel | undefined>(
      onboardingStatus.practiceExperienceLevel,
    );
  const savedInterviewFocus =
    onboardingStatus.practiceInterviewFocus === 'system-design'
      ? 'role-specific'
      : onboardingStatus.practiceInterviewFocus;
  const [interviewFocus, setInterviewFocus] =
    useState<V2InterviewFocus | undefined>(savedInterviewFocus);
  const [error, setError] = useState<string | null>(null);

  function finish(firstAction: V2OnboardingFirstAction) {
    setError(null);
    startTransition(async () => {
      const result = await completeV2OnboardingAction({
        firstAction,
        targetRole,
        experienceLevel,
        interviewFocus,
      });

      if (result.status === 'error') {
        setError(result.message);
        return;
      }

      router.replace(
        firstAction === 'create'
          ? '/candidate/practices/new'
          : '/candidate/dashboard',
      );
      router.refresh();
    });
  }

  if (step === 'terms') {
    return <V2TermsAcceptance onSuccess={() => setStep('profile')} />;
  }

  if (step === 'profile') {
    return (
      <ProfileUpdate
        userProfile={userProfile}
        userEmail={userEmail}
        userType="candidate"
        onSuccess={() => setStep('target')}
      />
    );
  }

  return (
    <Card className="w-full max-w-xl border-primary/15 shadow-sm">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-2xl">Set your Practice target</CardTitle>
          <CardDescription className="mt-1.5 leading-6">
            These are private preferences used to tailor Practices and coaching.
            You can skip any of them.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="target-role">Target role</Label>
          <Input
            id="target-role"
            value={targetRole}
            maxLength={120}
            onChange={(event) => setTargetRole(event.target.value)}
            placeholder="e.g. Software Engineer"
          />
        </div>

        <div className="space-y-2.5">
          <Label>Experience level</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {experienceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={experienceLevel === option.value ? 'default' : 'outline'}
                className="w-full"
                onClick={() =>
                  setExperienceLevel((current) =>
                    current === option.value ? undefined : option.value,
                  )
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <Label>Interview focus</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {focusOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={interviewFocus === option.value ? 'default' : 'outline'}
                className="w-full"
                onClick={() =>
                  setInterviewFocus((current) =>
                    current === option.value ? undefined : option.value,
                  )
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="border-t pt-5">
          <div className="mb-3">
            <div className="font-medium">What would you like to do first?</div>
            <p className="mt-1 text-sm text-muted-foreground">
              This only chooses your starting point. You can create and take
              Practices at any time.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              size="lg"
              className="h-auto justify-between gap-3 px-4 py-4 text-left"
              disabled={isPending}
              onClick={() => finish('practice')}
            >
              <span className="flex items-center gap-3">
                <PlayCircle className="h-5 w-5" />
                <span>
                  <span className="block font-semibold">Practice an interview</span>
                  <span className="block text-xs font-normal opacity-80">
                    Start from your workspace
                  </span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>

            <Button
              type="button"
              size="lg"
              variant="outline"
              className="h-auto justify-between gap-3 px-4 py-4 text-left"
              disabled={isPending}
              onClick={() => finish('create')}
            >
              <span className="flex items-center gap-3">
                <Briefcase className="h-5 w-5" />
                <span>
                  <span className="block font-semibold">Create a Practice</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    AI, document, or manual
                  </span>
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0" />
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
