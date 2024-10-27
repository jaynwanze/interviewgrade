'use server';
import { getTemplateEvaluationCriteria } from '@/data/user/templates';
import { getCandidateUserProfile } from '@/data/user/user';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { InterviewTemplate, Table } from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { now } from 'moment';

export const getInterviewsTemplatesByCategory = async (
  interviewTemplate: InterviewTemplate,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const user = await serverGetLoggedInUser();
  const candidateProfile = await getCandidateUserProfile(user.id);
  const candidateProfileId = candidateProfile.id;
  const templateEvaluationCriteria = await getTemplateEvaluationCriteria(
    interviewTemplate.id,
  );
  // Extract the evaluation criteria from the data
  const interviewEvaluationCriteria = templateEvaluationCriteria.map(
    (item) => item.evaluation_criteria,
  );

  //maybe add in description

  const { data, error } = await supabase.from('interviews').insert({
    template_id: interviewTemplate.id,
    candidate_id: candidateProfileId,
    title: interviewTemplate.title,
    role: interviewTemplate.role,
    difficulty: interviewTemplate.difficulty,
    questions_count: interviewTemplate.questions_count,
    duration: interviewTemplate.duration,
    evaluation_criteria: interviewEvaluationCriteria,
    start_time: now().toString(), // Ensure the time is in ISO format
    status: 'not_started',
    is_general: interviewTemplate.is_general,
    created_at: now().toString(), // Add created_at field if required
  });
  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert interview data');
  }
  return data;
};