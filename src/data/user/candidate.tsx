'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import type {
  JobTracker,
  SAPayload,
  SupabaseFileUploadOptions,
  Table,
} from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import type { AuthUserMetadata } from '@/utils/zod-schemas/authUserMetadata';
import { User } from '@supabase/supabase-js';
import slugify from 'slugify';
import urlJoin from 'url-join';
import { refreshSessionAction } from './session';

export async function updateCandidateProfileDetailsAction({
  currentUser,
  city,
  country,
  phone_number,
  summary,
  role,
  industry,
  resume_url,
}: {
  currentUser: User;
  city?: string;
  country?: string;
  phone_number?: string;
  summary?: string;
  role?: string;
  industry?: string;
  resume_url?: string;
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
      resume_url,
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
    resume_url,
  }: {
    fullName?: string;
    avatarUrl?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    summary?: string;
    role?: string;
    industry?: string;
    resume_url?: string;
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
    resume_url,
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

export async function uploadPublicCandidateResume(
  formData: FormData,
  fileName: string,
  fileOptions?: SupabaseFileUploadOptions,
): Promise<SAPayload<string>> {
  const file = formData.get('file');
  if (!file) {
    return { status: 'error', message: 'No file provided' };
  }

  const user = await serverGetLoggedInUser();
  if (!user) {
    return { status: 'error', message: 'User not found' };
  }

  const supabase = createSupabaseUserServerActionClient();

  // maybe store in the same 'public-user-assets' bucket or create a 'resumes' bucket
  const slug = slugify(fileName, { lower: true, strict: true });
  const path = `${user.id}/resume/${slug}`; // path in your bucket

  const { data, error } = await supabase.storage
    .from('public-user-assets')
    .upload(path, file, fileOptions);

  if (error) {
    return { status: 'error', message: error.message };
  }

  const supabaseFileUrl = urlJoin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    '/storage/v1/object/public/public-user-assets',
    data.path,
  );

  return {
    status: 'success',
    data: supabaseFileUrl,
  };
}

export async function deletePublicCandidateResume(
  resumeUrl: string,
): Promise<SAPayload> {
  const user = await serverGetLoggedInUser();
  if (!user) {
    return { status: 'error', message: 'User not found' };
  }

  const supabase = createSupabaseUserServerActionClient();

  const path = new URL(resumeUrl).pathname;
  const { error } = await supabase.storage
    .from('public-user-assets')
    .remove([path]);

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'success' };
}

export async function fetchJobTrackerApplications(): Promise<
  Table<'job_application_tracker'>[]
> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  const supabase = createSupabaseUserServerActionClient();
  const { data, error } = await supabase
    .from('job_application_tracker')
    .select('*')
    .eq('candidate_id', id);

  if (error) {
    throw new Error(
      `Failed to fetch job tracker applications: ${error.message}`,
    );
  }
  if (!data) {
    return [];
  }

  return data;
}

export async function addJobTrackerApplication(
  newJob: Partial<JobTracker>,
): Promise<Table<'job_application_tracker'>> {
  const user = await serverGetLoggedInUser();
  const { user_metadata, id } = user;
  if (user_metadata.userType === 'employee') {
    throw new Error('This user is not a candidate');
  }

  const supabase = createSupabaseUserServerActionClient();

  const { data, error } = await supabase
    .from('job_application_tracker')
    .insert({
      ...newJob,
      candidate_id: id,
      job_title: newJob.job_title || '',
      status: newJob.status || 'not_started',
      company: newJob.company || '',
      created_at: newJob.created_at || new Date().toISOString(),
    })
    .eq('candidate_id', id)
    .select();

  if (error) {
    throw new Error(`Failed to add job application: ${error.message}`);
  }

  return data[0];
}
