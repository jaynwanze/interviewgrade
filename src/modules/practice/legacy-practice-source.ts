import 'server-only';

import type { EvaluationCriteriaType, PracticeTemplate, Table } from '@/types';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';

export type LegacyPracticeQuestionPool = {
  criterion: EvaluationCriteriaType;
  questions: Table<'questions'>[];
};

export type LegacyPracticeSource = {
  template: PracticeTemplate;
  pools: LegacyPracticeQuestionPool[];
};

/**
 * Read-only compatibility adapter around the legacy built-in Practice catalog.
 * No new v2 feature should write to these tables.
 */
export async function loadLegacyBuiltInPracticeSource(
  templateId: string,
): Promise<LegacyPracticeSource> {
  const supabase = createSupabaseUserServerComponentClient();

  const { data: template, error: templateError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', templateId)
    .single();

  if (templateError || !template) {
    throw templateError ?? new Error('Built-in practice template was not found.');
  }

  if (template.is_system_defined === false) {
    throw new Error('Only built-in Practice templates can use the v2 catalog bridge.');
  }

  const { data: links, error: criteriaError } = await supabase
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
    .limit(5);

  if (criteriaError) {
    throw criteriaError;
  }

  const criteria = (links ?? [])
    .filter((item) => item.evaluation_criteria !== null)
    .flatMap((item) => item.evaluation_criteria) as EvaluationCriteriaType[];

  if (criteria.length === 0) {
    throw new Error('Built-in practice template has no scoring criteria.');
  }

  const pools = await Promise.all(
    criteria.map(async (criterion): Promise<LegacyPracticeQuestionPool> => {
      const { data: questions, error: questionError } = await supabase
        .from('questions')
        .select('*')
        .eq('template_id', templateId)
        .eq('evaluation_criteria_id', criterion.id);

      if (questionError) {
        throw questionError;
      }

      return {
        criterion,
        questions: questions ?? [],
      };
    }),
  );

  const usablePools = pools.filter((pool) => pool.questions.length > 0);
  if (usablePools.length === 0) {
    throw new Error('Built-in practice template has no usable question pools.');
  }

  return {
    template: template as PracticeTemplate,
    pools: usablePools,
  };
}
