'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { EvaluationCriteriaType, Table } from '@/types';

export const getInterviewsTemplatesByCategory = async (
  category: string,
): Promise<Table<'templates'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('category', category)
    .order('title', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

export const getInterviewsTemplatesByCategoryAndMode = async (
  mode: string,
  category: string,
): Promise<Table<'templates'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('category', category)
    .neq('skill', null)
    .order('title', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

export const getPracticeTemplateEvaluationsByTemplate = async (
  templateId: string,
): Promise<EvaluationCriteriaType[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('template_evaluation_criteria')
    .select(
      `
    evaluation_criteria (
      id,
      user_id,
      interview_evaluation_criteria_id,
      name,
      description,
      rubrics,
      is_system_defined,
      created_at
    )
    `,
    )
    .eq('template_id', templateId)
    .limit(3);

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Filter out items where evaluation_criteria is null and ensure rubrics is valid JSON
  return data
    .filter((item) => item.evaluation_criteria !== null)
    .map((item) => ({
      id: item.evaluation_criteria?.id ?? '',
      name: item.evaluation_criteria?.name ?? '',
      description: item.evaluation_criteria?.description ?? '',
      rubrics:
        typeof item.evaluation_criteria?.rubrics === 'string'
          ? JSON.parse(item.evaluation_criteria.rubrics)
          : (item.evaluation_criteria?.rubrics ?? []),
      is_system_defined: item.evaluation_criteria?.is_system_defined ?? false,
      created_at: item.evaluation_criteria?.created_at ?? '',
    }));
};

export const getInterviewEvaluationCriteriasByTemplate = async (
  interviewTemplateId: string,
): Promise<EvaluationCriteriaType[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('interview_template_interview_evaluation_criteria')
    .select(
      `
    interview_evaluation_criteria (
      id,
      user_id,
      name,
      description,
      rubrics,
      is_system_defined,
      created_at
    )
    `,
    )
    .eq('interview_template_id', interviewTemplateId);

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  // Filter out items where evaluation_criteria is null and ensure rubrics is valid JSON
  return data
    .filter((item) => item.interview_evaluation_criteria !== null)
    .map((item) => ({
      id: item.interview_evaluation_criteria?.id ?? '',
      name: item.interview_evaluation_criteria?.name ?? '',
      description: item.interview_evaluation_criteria?.description ?? '',
      rubrics:
        typeof item.interview_evaluation_criteria?.rubrics === 'string'
          ? JSON.parse(item.interview_evaluation_criteria.rubrics)
          : (item.interview_evaluation_criteria?.rubrics ?? []),
      is_system_defined:
        item.interview_evaluation_criteria?.is_system_defined ?? false,
      created_at: item.interview_evaluation_criteria?.created_at ?? '',
    }));
};

export const getPracticeEvaluationCriteriasByInterviewEvalCriteria = async (
  interviewEvalCriteriaId: string,
): Promise<EvaluationCriteriaType[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('template_evaluation_criteria')
    .select(
      `
      evaluation_criteria (
        id,
        user_id,
        interview_evaluation_criteria_id,
        name,
        description,
        rubrics,
        is_system_defined,
        created_at
      )
    `,
    )
    .eq('evaluation_criteria_id', interviewEvalCriteriaId);

  if (error) {
    throw error;
  }

  if (!data) {
    return [];
  }

  return data
    .filter((item) => item.evaluation_criteria !== null)
    .map((item) => ({
      id: item.evaluation_criteria?.id ?? '',
      name: item.evaluation_criteria?.name ?? '',
      description: item.evaluation_criteria?.description ?? '',
      rubrics:
        typeof item.evaluation_criteria?.rubrics === 'string'
          ? JSON.parse(item.evaluation_criteria.rubrics)
          : (item.evaluation_criteria?.rubrics ?? []),
      is_system_defined: item.evaluation_criteria?.is_system_defined ?? false,
      created_at: item.evaluation_criteria?.created_at ?? '',
    }));
};

export const getPracticeTemplateQuestionsByTemplateIdAndEvalCriteria = async (
  templateId: string,
  evaluationCriteriaId: string,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', templateId)
    .eq('evaluation_criteria_id', evaluationCriteriaId);
  if (error) {
    throw error;
  }

  return data;
};

export const getPracticeTemplateQuestionByInterviewEvaluationCriteria = async (
  interviewEvaluationCriteriaId: string,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch evaluation criteria along with their associated questions
  const { data, error } = await supabase
    .from('evaluation_criteria')
    .select(
      `
      questions (
        id,
        template_id,
        evaluation_criteria_id,
        type,
        text,
        sample_answer
      )
    `,
    )
    .eq('interview_evaluation_criteria_id', interviewEvaluationCriteriaId);

  if (error) {
    console.error('Error fetching evaluation criteria and questions:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('No evaluation criteria found for the provided ID.');
    return [];
  }

  // Aggregate all questions from the fetched evaluation criterias
  const allQuestions: Table<'questions'>[] = data.flatMap(
    (item) => item.questions ?? [],
  );

  return allQuestions;
};
