'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type { SAPayload } from '@/types';
import { refreshSessionAction } from '@/data/user/session';

export type V2OnboardingFirstAction = 'practice' | 'create';
export type V2ExperienceLevel = 'intern' | 'graduate' | 'mid' | 'senior';
export type V2InterviewFocus =
  | 'behavioral'
  | 'technical'
  | 'system-design'
  | 'mixed';

export async function completeV2OnboardingAction(input: {
  firstAction: V2OnboardingFirstAction;
  targetRole?: string;
  experienceLevel?: V2ExperienceLevel;
  interviewFocus?: V2InterviewFocus;
}): Promise<SAPayload<boolean>> {
  const supabase = createSupabaseUserServerActionClient();
  const targetRole = input.targetRole?.trim().slice(0, 120) || undefined;

  const { error } = await supabase.auth.updateUser({
    data: {
      onboardingVersion: 2,
      onboardingV2Complete: true,
      onboardingV2FirstAction: input.firstAction,
      practiceTargetRole: targetRole,
      practiceExperienceLevel: input.experienceLevel,
      practiceInterviewFocus: input.interviewFocus,
    },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  const refresh = await refreshSessionAction();
  if (refresh.status === 'error') {
    return refresh;
  }

  return { status: 'success', data: true };
}
