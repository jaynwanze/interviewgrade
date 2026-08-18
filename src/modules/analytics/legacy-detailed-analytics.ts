'use server';

import { getTemplateImgUrlById } from '@/data/user/templates';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  AvgEvaluationScores,
  InterviewAnalytics,
  QuestionAnswerFeedback,
} from '@/types';

export type LegacyDetailedAnalyticsMode = 'Practice Mode' | 'Interview Mode';

export type LegacyAnalyticsTrendEvaluation = {
  id: string;
  interview_id: string;
  overall_grade: number;
  created_at: string;
};

export type LegacyDetailedAnalytics = Omit<
  InterviewAnalytics,
  'completed_interview_evaluations'
> & {
  completed_interview_evaluations: LegacyAnalyticsTrendEvaluation[];
};

/**
 * Lean detailed analytics read model for the legacy dashboard.
 *
 * The initial view deliberately does not select question_answer_feedback or
 * chat_messages. Those JSON payloads can grow with every answer and are only
 * needed by optional sentiment enrichment, which has its own secondary read.
 */
export async function getLegacyDetailedAnalytics(
  candidateId: string,
  templateId: string,
  mode: LegacyDetailedAnalyticsMode,
): Promise<LegacyDetailedAnalytics | null> {
  const normalizedCandidateId = candidateId.trim();
  const normalizedTemplateId = templateId.trim();
  if (!normalizedCandidateId || !normalizedTemplateId) {
    return null;
  }

  const supabase = createSupabaseUserServerComponentClient();
  let interviewQuery = supabase
    .from('interviews')
    .select('id,title,description,question_count')
    .eq('candidate_id', normalizedCandidateId)
    .eq('status', 'completed');

  interviewQuery =
    mode === 'Practice Mode'
      ? interviewQuery.eq('template_id', normalizedTemplateId)
      : interviewQuery.eq('interview_template_id', normalizedTemplateId);

  const { data: interviews, error: interviewError } = await interviewQuery;
  if (interviewError) {
    throw interviewError;
  }
  if (!interviews?.length) {
    return null;
  }

  const interviewIds = interviews.map((interview) => interview.id);
  const { data: evaluations, error: evaluationError } = await supabase
    .from('interview_evaluations')
    .select(
      'id,interview_id,overall_grade,evaluation_scores,strengths,areas_for_improvement,recommendations,created_at',
    )
    .in('interview_id', interviewIds)
    .order('created_at', { ascending: true });

  if (evaluationError) {
    throw evaluationError;
  }
  if (!evaluations?.length) {
    return null;
  }

  const avgOverallGrade =
    evaluations.reduce(
      (sum, evaluation) => sum + Number(evaluation.overall_grade ?? 0),
      0,
    ) / evaluations.length;

  const criteriaMap = new Map<
    string,
    { name: string; total: number; count: number; feedbacks: string[] }
  >();

  for (const evaluation of evaluations) {
    for (const score of evaluation.evaluation_scores ?? []) {
      const existing = criteriaMap.get(score.id);
      if (existing) {
        existing.total += score.score;
        existing.count += 1;
        existing.feedbacks.push(score.feedback);
      } else {
        criteriaMap.set(score.id, {
          name: score.name,
          total: score.score,
          count: 1,
          feedbacks: [score.feedback],
        });
      }
    }
  }

  const avgEvaluationCriteriaScores: AvgEvaluationScores[] = Array.from(
    criteriaMap.values(),
  ).map((criterion) => ({
    name: criterion.name,
    avg_score: criterion.total / criterion.count,
    feedback_summary: criterion.feedbacks,
  }));

  const bestCriterion = avgEvaluationCriteriaScores.reduce<
    AvgEvaluationScores | null
  >(
    (best, current) =>
      !best || current.avg_score > best.avg_score ? current : best,
    null,
  );

  const firstInterview = interviews[0];
  const imgUrl = await getTemplateImgUrlById(normalizedTemplateId, mode);

  return {
    template_id: mode === 'Practice Mode' ? normalizedTemplateId : null,
    interview_template_id:
      mode === 'Interview Mode' ? normalizedTemplateId : null,
    interview_title: firstInterview.title,
    interview_description: firstInterview.description,
    total_interviews: interviews.length,
    question_count: firstInterview.question_count,
    avg_overall_grade: avgOverallGrade,
    avg_evaluation_criteria_scores: avgEvaluationCriteriaScores,
    strengths_summary: evaluations.map((evaluation) => evaluation.strengths),
    areas_for_improvement_summary: evaluations.map(
      (evaluation) => evaluation.areas_for_improvement,
    ),
    recommendations_summary: evaluations.map(
      (evaluation) => evaluation.recommendations,
    ),
    completed_interview_evaluations: evaluations.map((evaluation) => ({
      id: evaluation.id,
      interview_id: evaluation.interview_id,
      overall_grade: evaluation.overall_grade,
      created_at: evaluation.created_at,
    })),
    best_evaluation_crieria: bestCriterion?.name ?? '',
    img_url: imgUrl,
  };
}

/**
 * Secondary transcript read used only after core detailed analytics have
 * rendered. This keeps large question_answer_feedback JSON off the critical
 * path while preserving the existing sentiment behavior.
 */
export async function getLegacyDetailedAnalyticsAnswers(
  candidateId: string,
  templateId: string,
  mode: LegacyDetailedAnalyticsMode,
): Promise<string[]> {
  const normalizedCandidateId = candidateId.trim();
  const normalizedTemplateId = templateId.trim();
  if (!normalizedCandidateId || !normalizedTemplateId) {
    return [];
  }

  const supabase = createSupabaseUserServerComponentClient();
  let interviewQuery = supabase
    .from('interviews')
    .select('id')
    .eq('candidate_id', normalizedCandidateId)
    .eq('status', 'completed');

  interviewQuery =
    mode === 'Practice Mode'
      ? interviewQuery.eq('template_id', normalizedTemplateId)
      : interviewQuery.eq('interview_template_id', normalizedTemplateId);

  const { data: interviews, error: interviewError } = await interviewQuery;
  if (interviewError) {
    throw interviewError;
  }
  if (!interviews?.length) {
    return [];
  }

  const { data: evaluations, error: evaluationError } = await supabase
    .from('interview_evaluations')
    .select('question_answer_feedback')
    .in(
      'interview_id',
      interviews.map((interview) => interview.id),
    );

  if (evaluationError) {
    throw evaluationError;
  }

  return (evaluations ?? []).flatMap((evaluation) => {
    const feedback = (evaluation.question_answer_feedback ?? []) as unknown as
      | QuestionAnswerFeedback[]
      | null;
    return (feedback ?? [])
      .map((question) => question.answer)
      .filter(
        (answer): answer is string =>
          typeof answer === 'string' && answer.trim().length > 0,
      );
  });
}
