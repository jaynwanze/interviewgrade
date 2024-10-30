'use server';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { Table } from '@/types';

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

export const getTemplateEvaluationCriteria = async (templateId: string) => {
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
      )
    `,
    )
    .eq('template_id', templateId);

  if (error) {
    throw error;
  }

  return data;
};

export const getTemplateQuestions = async (
  templateId: string,
): Promise<Table<'questions'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('template_id', templateId);

  if (error) {
    throw error;
  }

  return data;
};
