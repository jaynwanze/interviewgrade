'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  EvaluationCriteriaType,
  InterviewEvaluationCriteriaType,
  Table,
} from '@/types';

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

export const getPracticeTemplatesByCategoryAndMode = async (
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

export const getInterviewTemplatesByCategory = async (
  category: string,
): Promise<Table<'interview_templates'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_templates')
    .select('*')
    .eq('category', category)
    .order('title', { ascending: true });
  if (error) {
    throw error;
  }
  return data;
};

export const getPracticeTemplateEvaluationsByTemplateId = async (
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
): Promise<InterviewEvaluationCriteriaType[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('interview_template_interview_evaluation_criteria')
    .select(
      `
    interview_evaluation_criteria (
      id,
      user_id,
      template_id,
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

  if (!data || data.length === 0) {
    console.warn('No interview evaluation criteria found for the provided ID.');
    return [];
  }

  // Filter out items where evaluation_criteria is null and ensure rubrics is valid JSON
  return data
    .filter((item) => item.interview_evaluation_criteria !== null)
    .map((item) => ({
      id: item.interview_evaluation_criteria?.id ?? '',
      user_id: item.interview_evaluation_criteria?.user_id ?? '',
      template_id: item.interview_evaluation_criteria?.template_id ?? '',
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

export const getPracticeTemplateQuestionByTemplateId = async (
  practiceTemplateId: string,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch evaluation criteria along with their associated questions
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', practiceTemplateId);

  if (error) {
    console.error('Error fetching evaluation criteria and questions:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    console.warn('No evaluation criteria found for the provided ID.');
    return [];
  }

  return data;
};
