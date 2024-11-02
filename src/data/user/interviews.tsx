'use server';
import {
  getTemplateEvaluationCriteria,
  getTemplateQuestions,
} from '@/data/user/templates';
import { getCandidateUserProfile } from '@/data/user/user';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  InterviewEvaulation,
  InterviewTemplate,
  SAPayload,
  Table,
} from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import moment from 'moment';

export const createInterview = async (
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
  const InterviewEvaluationCriteria = templateEvaluationCriteria
    .map((item) => item.evaluation_criteria)
    .filter((criteria) => criteria !== null);

  //maybe add in description

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      template_id: interviewTemplate.id,
      candidate_id: candidateProfileId,
      title: interviewTemplate.title,
      role: interviewTemplate.role,
      difficulty: interviewTemplate.difficulty,
      question_count: interviewTemplate.question_count,
      duration: interviewTemplate.duration,
      evaluation_criteria: InterviewEvaluationCriteria,
      start_time: moment().toISOString(), // Ensure the time is in ISO format
      status: 'not_started',
      is_general: interviewTemplate.is_general,
      is_system_defined: interviewTemplate.is_system_defined,
    })
    .select('*');
  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert interview data');
  }

  await createInterviewQuestions(data[0].id, interviewTemplate);

  return data[0];
};

export const createInterviewQuestions = async (
  interviewId: string,
  interviewTemplate: InterviewTemplate,
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch template questions
  const templateQuestions = await getTemplateQuestions(interviewTemplate.id);
  if (!templateQuestions || templateQuestions.length === 0) {
    throw new Error('Failed to fetch template questions or no questions found');
  }

  let lastInsertData: Table<'interview_questions'> | null = null;

  for (const question of templateQuestions) {
    const { data, error } = await supabase
      .from('interview_questions')
      .insert([
        {
          interview_id: interviewId,
          type: question.type,
          text: question.text,
          sample_answer: question.sample_answer,
        },
      ])
      .select('*');

    if (error) {
      console.error('Error inserting interview question:', error);
      throw new Error(`Error inserting interview question: ${error.message}`);
    }

    lastInsertData = data ? data[0] : null;
  }

  if (!lastInsertData) {
    throw new Error('No interview questions were inserted');
  }

  return {
    status: 'success',
    data: lastInsertData,
  };
};

export const getInterviewQuestions = async (
  interviewId: string,
): Promise<Table<'interview_questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_questions')
    .select('*')
    .eq('interview_id', interviewId);

  if (error) {
    throw error;
  }

  return data;
};

export const getInterview = async (
  interviewId: string,
): Promise<Table<'interviews'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const insertInterviewAnswer = async (
  interviewQuestionId: string,
  answer: string,
): Promise<Table<'interview_answers'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_answers')
    .insert({
      interview_question_id: interviewQuestionId,
      text: answer,
    })
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const insertInterviewEvaluation = async (
  interviewId: string,
  InterviewEvaluation: InterviewEvaulation,
): Promise<Table<'interview_evaluations'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_evaluations')
    .insert({
      interview_id: interviewId,
      overall_score: InterviewEvaluation.overall_score,
      evaluation_scores: InterviewEvaluation.evaluation_scores,
      strengths: InterviewEvaluation.strengths,
      areas_for_improvement: InterviewEvaluation.areas_for_improvement,
      recommendations: InterviewEvaluation.recommendations,
    })
    .single();

  if (error) {
    throw error;
  }

  return data;
};
