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
): Promise<
  Table<'templates'>[]
> => {
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

export const getTemplateEvaluationCriteriasJsonFormat = async (
  templateId: string,
): Promise<EvaluationCriteriaType[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('template_evaluation_criteria')
    .select(
      `
    evaluation_criteria (
      id,
      name,
      description,
      rubrics,
      is_system_defined,
      created_at
    )
    `,
    )
    .eq('template_id', templateId);

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

export const getTemplateQuestions = async (
  templateId: string,
  questionCount: number,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', templateId)
    .limit(questionCount);

  if (error) {
    throw error;
  }

  return data;
};

export const getTemplateQuestionByEvaluationCriteria = async (
  templateId: string,
  evaluationCriteriaId: string,
  questionCount: number,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', templateId)
    .eq('evaluation_criteria_id', evaluationCriteriaId)
  if (error) {
    throw error;
  }

  return data;
};

export const getPracticeTemplateQuestions = async (
  templateId: string,
  questionCount: number,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data: allQuestions, error: allQuestionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', templateId);

  if (allQuestionsError) {
    throw allQuestionsError;
  }

  if (!allQuestions) {
    return [];
  }
  // Shuffle the questions array
  const shuffledQuestions = allQuestions.sort(() => 0.5 - Math.random());
  // Select the first `questionCount` questions
  const data = shuffledQuestions.slice(0, questionCount);

  return data;
};
