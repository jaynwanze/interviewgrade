'use server';

import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type { LegacyAnalyticsOverviewItem } from './legacy-analytics.types';

type AnalyticsMode = LegacyAnalyticsOverviewItem['mode'];

export async function getLegacyAnalyticsOverview(
  candidateId: string,
  mode: AnalyticsMode,
): Promise<LegacyAnalyticsOverviewItem[]> {
  const normalizedCandidateId = candidateId.trim();
  if (!normalizedCandidateId) {
    return [];
  }

  const supabase = createSupabaseUserServerComponentClient();
  const practiceMode = mode === 'Practice Mode';

  let interviewQuery = supabase
    .from('interviews')
    .select('id, template_id, interview_template_id, title')
    .eq('candidate_id', normalizedCandidateId)
    .eq('status', 'completed');

  interviewQuery = practiceMode
    ? interviewQuery.not('template_id', 'is', null)
    : interviewQuery.not('interview_template_id', 'is', null);

  const { data: interviews, error: interviewsError } = await interviewQuery;

  if (interviewsError) {
    throw interviewsError;
  }

  if (!interviews?.length) {
    return [];
  }

  const interviewIds = interviews.map((interview) => interview.id);
  const { data: evaluations, error: evaluationsError } = await supabase
    .from('interview_evaluations')
    .select('interview_id, overall_grade')
    .in('interview_id', interviewIds);

  if (evaluationsError) {
    throw evaluationsError;
  }

  const evaluationsByInterview = new Map<string, number[]>();
  for (const evaluation of evaluations ?? []) {
    const existing = evaluationsByInterview.get(evaluation.interview_id) ?? [];
    existing.push(evaluation.overall_grade);
    evaluationsByInterview.set(evaluation.interview_id, existing);
  }

  const aggregate = new Map<
    string,
    {
      title: string;
      totalScore: number;
      evaluationCount: number;
      completedSessions: number;
    }
  >();

  for (const interview of interviews) {
    const templateId = practiceMode
      ? interview.template_id
      : interview.interview_template_id;

    if (!templateId) {
      continue;
    }

    const scores = evaluationsByInterview.get(interview.id) ?? [];
    if (scores.length === 0) {
      continue;
    }

    const existing = aggregate.get(templateId) ?? {
      title: interview.title,
      totalScore: 0,
      evaluationCount: 0,
      completedSessions: 0,
    };

    existing.completedSessions += 1;
    existing.totalScore += scores.reduce((sum, score) => sum + score, 0);
    existing.evaluationCount += scores.length;
    aggregate.set(templateId, existing);
  }

  const templateIds = Array.from(aggregate.keys());
  if (templateIds.length === 0) {
    return [];
  }

  const imageByTemplate = new Map<string, string | null>();

  if (practiceMode) {
    const { data: templates, error: templatesError } = await supabase
      .from('templates')
      .select('id, img_url')
      .in('id', templateIds);

    if (templatesError) {
      throw templatesError;
    }

    for (const template of templates ?? []) {
      imageByTemplate.set(template.id, template.img_url);
    }
  } else {
    const { data: templates, error: templatesError } = await supabase
      .from('interview_templates')
      .select('id, img_url')
      .in('id', templateIds);

    if (templatesError) {
      throw templatesError;
    }

    for (const template of templates ?? []) {
      imageByTemplate.set(template.id, template.img_url);
    }
  }

  return templateIds
    .map((templateId) => {
      const item = aggregate.get(templateId)!;
      return {
        templateId,
        mode,
        title: item.title,
        averageScore: roundScore(item.totalScore / item.evaluationCount),
        completedSessions: item.completedSessions,
        imageUrl: imageByTemplate.get(templateId) ?? null,
      } satisfies LegacyAnalyticsOverviewItem;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}
