'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type { SAPayload, Table } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { User } from '@supabase/supabase-js';
import { refreshSessionAction } from './session';

export async function updateCandidateProfileDetailsAction({
  currentUser,
  city,
  country,
  phone_number,
  summary,
  role,
  industry,
}: {
  currentUser: User;
  city?: string;
  country?: string;
  phone_number?: string;
  summary?: string;
  role?: string;
  industry?: string;
}) {
  const user = currentUser;
  if (!user) {
    throw new Error('User not found');
  }

  const supabase = createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('candidates')
    .update({
      city,
      country,
      phone_number,
      summary,
      role,
      industry,
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update candidate: ${error.message}`);
  }

  return data;
}

// export async function updateCandidateSkillStatsAction({
//     candidateId,
//     newCandidateSkillStats,
//     interviewMode,
// }: {
//     candidateId: string;
//     newCandidateSkillStats: CandidateSkillsStats;
//     interviewMode: InterviewMode;
// }) {
//     const supabase = createSupabaseUserServerActionClient();
//     const insertColumn =
//         interviewMode === InterviewMode.PRACTICE
//             ? 'interview_skill_stats'
//             : 'practice_skill_stats_live';

//     return data;
// }

export const updateCandidateDetails = async (
  {
    city,
    country,
    phoneNumber,
    summary,
    role,
    industry,
  }: {
    fullName?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    summary?: string;
    role?: string;
    industry?: string;
  },
  {
    isOnboardingFlow = false,
  }: {
    isOnboardingFlow?: boolean;
  } = {},
): Promise<SAPayload<Table<'candidates'>>> => {
  'use server';
  const supabaseClient = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();

  const updatedCandidateProfile = await updateCandidateProfileDetailsAction({
    currentUser: user,
    city,
    country,
    phone_number: phoneNumber,
    summary,
    role,
    industry,
  });

  if (!updatedCandidateProfile) {
    return {
      status: 'error',
      message: 'Failed to update candidate profile',
    };
  }

  if (isOnboardingFlow) {
    const updateUserMetadataPayload: Partial<AuthUserMetadata> = {
      onboardingHasCompletedCandidateDetails: true,
    };

    const updateUserMetadataResponse = await supabaseClient.auth.updateUser({
      data: updateUserMetadataPayload,
    });

    if (updateUserMetadataResponse.error) {
      return {
        status: 'error',
        message: updateUserMetadataResponse.error.message,
      };
    }

    const refreshSessionResponse = await refreshSessionAction();
    if (refreshSessionResponse.status === 'error') {
      return refreshSessionResponse;
    }
  }

  return {
    status: 'success',
    data: updatedCandidateProfile,
  };
};


export async function markTutorialAsDoneAction() {
  const supabase = createSupabaseUserServerActionClient();
  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('No user found');
  }

  // Update the user’s metadata
  const { error } = await supabase.auth.updateUser({
    data: { onboardingHasDoneTutorial: true },
  });
  if (error) {
    throw new Error(error.message);
  }

  // Refresh session so the user metadata is up-to-date
  const refreshResult = await refreshSessionAction();
  if (refreshResult.status === 'error') {
    throw new Error(refreshResult.message);
  }

  return { status: 'success' as const };
}