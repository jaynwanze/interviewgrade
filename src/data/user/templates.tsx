'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  EvaluationCriteriaType,
  EvaluationRubricType,
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

export const getInterviewsTemplatesBySkill = async (): Promise<
  Table<'templates'>[]
> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('templates')
    .select('*')
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
      is_system_defined,
      created_at
    ),
    rubrics
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
    .filter(
      (
        item,
      ): item is {
        evaluation_criteria: EvaluationCriteriaType;
        rubrics: EvaluationRubricType[];
      } => item.evaluation_criteria !== null,
    )
    .map((item) => {
      const { evaluation_criteria, rubrics } = item;
      return {
        ...evaluation_criteria,
        rubrics: Array.isArray(rubrics) ? rubrics : [], // Ensure rubrics is an array
      };
    });
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
