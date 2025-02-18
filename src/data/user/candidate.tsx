'use server';

import { createSupabaseUserServerActionClient } from '@/supabase-clients/user/createSupabaseUserServerActionClient';
import { CandidateSkillsStats, InterviewMode } from '@/types';
import { User } from '@supabase/supabase-js';

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
