'use server';
import {
  getPracticeTemplateQuestions,
  getTemplateEvaluationCriteriasJsonFormat,
  getTemplateQuestions,
} from '@/data/user/templates';
import { getCandidateUserProfile } from '@/data/user/user';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  AvgEvaluationScores,
  EvaluationScores,
  FeedbackData,
  Interview,
  InterviewComplete,
  InterviewEvaluation,
  InterviewModeType,
  InterviewTemplate,
  InterviewUpdate,
  SAPayload,
  Table,
} from '@/types';
import { INTERVIEW_INTERVIEW_MODE } from '@/utils/constants';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import moment from 'moment';

export const createInterview = async (
  interviewTemplate: InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const user = await serverGetLoggedInUser();
  const candidateProfile = await getCandidateUserProfile(user.id);
  const candidateProfileId = candidateProfile.id;
  const templateEvaluationCriterias =
    await getTemplateEvaluationCriteriasJsonFormat(interviewTemplate.id);

  //maybe add in description
  const { data, error } = await supabase
    .from('interviews')
    .insert({
      template_id: interviewTemplate.id,
      candidate_id: candidateProfileId,
      title: interviewTemplate.title,
      description: interviewTemplate.description,
      mode: interviewMode,
      role: interviewTemplate.role,
      skill: interviewTemplate.skill,
      difficulty: interviewTemplate.difficulty,
      question_count: interviewTemplate.question_count,
      duration: interviewTemplate.duration,
      evaluation_criterias: templateEvaluationCriterias,
      start_time: moment().toISOString(),
      status: 'not_started',
      current_question_index: 0,
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

  await createInterviewQuestions(data[0].id, interviewTemplate, interviewMode);

  return data[0];
};

export const createInterviewQuestions = async (
  interviewId: string,
  interviewTemplate: InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch template questions
  const templateQuestions =
    interviewMode === INTERVIEW_INTERVIEW_MODE
      ? await getTemplateQuestions(
        interviewTemplate.id,
        interviewTemplate.question_count,
      )
      : await getPracticeTemplateQuestions(
        interviewTemplate.id,
        interviewTemplate.question_count,
      );
  if (!templateQuestions || templateQuestions.length === 0) {
    throw new Error('Failed to fetch template questions or no questions found');
  }

  const templateEvaluationCriterias =
    await getTemplateEvaluationCriteriasJsonFormat(interviewTemplate.id);

  let lastInsertData: Table<'interview_questions'> | null = null;

  for (const question of templateQuestions) {
    // Find the corresponding evaluation criteria
    const evaluationCriteria = templateEvaluationCriterias.find(
      (criteria) => criteria.id === question.evaluation_criteria_id,
    );
    if (!evaluationCriteria) {
      throw new Error(
        `Evaluation criteria not found for question: ${question.text}`,
      );
    }
    const { data, error } = await supabase
      .from('interview_questions')
      .insert([
        {
          interview_id: interviewId,
          type: question.type,
          text: question.text,
          evaluation_criteria: evaluationCriteria,
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
    return {
      status: 'error',
      message: 'No interview questions were inserted',
    };
  }

  return {
    status: 'success',
    data: lastInsertData,
  };
};

export const updateInterview = async (
  data: InterviewUpdate,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { error } = await supabase
    .from('interviews')
    .update(data)
    .eq('id', data.id);

  if (error) {
    throw error;
  }

  return data as Table<'interviews'>;
};

export const completeInterview = async (
  data: InterviewComplete,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { error } = await supabase
    .from('interviews')
    .update(data)
    .eq('id', data.id);

  if (error) {
    throw error;
  }

  return data as Table<'interviews'>;
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

export const getInterviewAnswers = async (
  interviewQuestionIds: string[],
): Promise<Table<'interview_answers'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_answers')
    .select('*')
    .in('interview_question_id', interviewQuestionIds);

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
/*
export const updateInterviewAnswer = async (
  data: QuestionAnswerFeedback[],
): Promise<SAPayload<Table<'interview_answers'>[]>> => {
  const supabase = createSupabaseUserServerComponentClient();
  let lastInsertData: Table<'interview_answers'> | null = null;

  for (const answer of data) {
    const { data, error } = await supabase
      .from('interview_answers')
      .update({
        score: answer.score,
        feedback: answer.feedback,
      })
      .eq('id', answer.interview_answer_id);
    if (error) {
      throw error;
    }

    lastInsertData = data ? data[0] : null;
  }

  if (!lastInsertData) {
    return {
      status: 'error',
      message: 'No interview answer were updated',
    };
  }

  return {
    status: 'success',
    data: lastInsertData,
  };
};
*/

export const insertInterviewEvaluation = async (
  interviewId: string,
  interviewEvaluation: FeedbackData,
): Promise<Table<'interview_evaluations'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_evaluations')
    .insert({
      interview_id: interviewId,
      overall_grade: interviewEvaluation.overall_grade,
      evaluation_scores: interviewEvaluation.evaluation_scores,
      strengths: interviewEvaluation.strengths,
      areas_for_improvement: interviewEvaluation.areas_for_improvement,
      recommendations: interviewEvaluation.recommendations,
      question_answer_feedback: interviewEvaluation.question_answer_feedback,
    })
    .select();

  if (error) {
    throw error;
  }

  return data[0];
};

export const updateInterviewAnalytics = async (
  interview: Interview,
  interviewEvaluation: InterviewEvaluation,
): Promise<Table<'interview_analytics'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  // Fetch existing periodic analytics record
  const { data: existingAnalytics, error: fetchError } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('template_id', interview.template_id)
    .maybeSingle();

  if (fetchError) {
    // PGRST116: No rows found
    if (fetchError.code !== 'PGRST116') {
      console.error(
        'Error fetching existing periodic analytics:',
        fetchError.message,
      );
      return null;
    }
    throw fetchError;
  }

  if (!existingAnalytics) {
    const avgEvaluationCriteriaScores = () => {
      return interviewEvaluation.evaluation_scores.map((score) => ({
        id: score.id,
        name: score.name,
        avg_score: score.score,
        feedback_summary: [score.feedback],
      }));
    };

    // Create a new interview analytics record
    const { data: updatedInterviewAnalytics, error: insertError } =
      await supabase
        .from('interview_analytics')
        .insert([
          {
            template_id: interview.template_id,
            candidate_id: interview.candidate_id,
            interview_title: interview.title,
            interview_description: interview.description,
            total_interviews: 1,
            question_count: interview.question_count,
            avg_overall_grade: interviewEvaluation.overall_grade,
            avg_evaluation_criteria_scores: avgEvaluationCriteriaScores(),
            strengths_summary: [interviewEvaluation.strengths],
            areas_for_improvement_summary: [
              interviewEvaluation.areas_for_improvement,
            ],
            recommendations_summary: [interviewEvaluation.recommendations],
          },
        ])
        .select();

    if (insertError) {
      console.error('Error inserting new analytics:', insertError.message);
      throw insertError;
    }

    if (!updatedInterviewAnalytics) {
      throw new Error('Failed to update interview analytics');
    }
    return updatedInterviewAnalytics[0];
  } else {
    // Update the existing periodic analytics record
    const newTotal = existingAnalytics.total_interviews + 1;
    const newAvgOverall =
      (existingAnalytics.avg_overall_grade *
        existingAnalytics.total_interviews +
        interviewEvaluation.overall_grade) /
      newTotal;

    // Recalculate average evaluation criteria
    const updatedEvalCriteria: AvgEvaluationScores[] = [
      ...existingAnalytics.avg_evaluation_criteria_scores,
    ];
    for (const score of interviewEvaluation.evaluation_scores) {
      const existingScore = updatedEvalCriteria.find(
        (item) => item.id === score.id,
      );
      if (existingScore) {
        existingScore.avg_score =
          (existingScore.avg_score * existingAnalytics.total_interviews +
            score.score) /
          newTotal;
        existingScore.feedback_summary.push(score.feedback);
      } else {
        updatedEvalCriteria.push({
          id: score.id,
          name: score.name,
          avg_score: score.score,
          feedback_summary: [score.feedback],
        });
      }
    }

    // Append to summaries arrays
    const updatedStrengths = [
      ...existingAnalytics.strengths_summary,
      interviewEvaluation.strengths,
    ];
    const updatedAreas = [
      ...existingAnalytics.areas_for_improvement_summary,
      interviewEvaluation.areas_for_improvement,
    ];
    const updatedRecommendations = [
      ...existingAnalytics.recommendations_summary,
      interviewEvaluation.recommendations,
    ];

    const { data: updatedInterviewAnalytics, error: updateError } =
      await supabase
        .from('interview_analytics')
        .update({
          total_interviews: newTotal,
          avg_overall_grade: newAvgOverall,
          avg_evaluation_criteria: updatedEvalCriteria,
          strengths_summary: updatedStrengths,
          areas_for_improvement_summary: updatedAreas,
          recommendations_summary: updatedRecommendations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnalytics.id);

    if (updateError) {
      console.error('Error updating periodic analytics:', updateError.message);
      throw updateError;
    }

    if (!updatedInterviewAnalytics) {
      throw new Error('Failed to update interview analytics');
    }
    return updatedInterviewAnalytics;
  }
};

export const removeInterviewAnalytics = async (
  interview_template_id: string,
  deletedInterviewEvaluation: InterviewEvaluation,
): Promise<string | null> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch existing periodic analytics record
  const { data: existingAnalytics, error: fetchError } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('template_id', interview_template_id)
    .single();

  if (fetchError) {
    console.error(
      'Error fetching existing periodic analytics:',
      fetchError.message,
    );
    throw fetchError;
  }

  if (!existingAnalytics) {
    // No analytics record exists; nothing to do
    return null;
  }

  const newTotal = existingAnalytics.total_interviews - 1;

  if (newTotal <= 0) {
    // Optionally delete the analytics record if no interviews remain in the period
    const { error: deleteError } = await supabase
      .from('interview_analytics')
      .delete()
      .eq('id', existingAnalytics.id);

    if (deleteError) {
      console.error('Error deleting periodic analytics:', deleteError.message);
      throw deleteError;
    }

    return null;
  }

  const newAvgOverall =
    (existingAnalytics.avg_overall_grade * existingAnalytics.total_interviews -
      deletedInterviewEvaluation.overall_grade) /
    newTotal;

  // Recalculate average evaluation criteria
  const updatedEvalCriteria: AvgEvaluationScores[] =
    existingAnalytics.avg_evaluation_criteria_scores.map(
      (score: AvgEvaluationScores) => {
        const deletedScore = deletedInterviewEvaluation.evaluation_scores.find(
          (s: EvaluationScores) => s.id === score.id,
        );
        if (deletedScore) {
          score.avg_score =
            (score.avg_score * existingAnalytics.total_interviews -
              deletedScore.score) /
            newTotal;
          score.feedback_summary = score.feedback_summary.filter(
            (f: string) => f !== deletedScore.feedback,
          );
        }
        return score;
      },
    );
  // Remove the deleted interview's summaries from the arrays
  const updatedStrengths = existingAnalytics.strengths_summary.filter(
    (s: string) => s !== deletedInterviewEvaluation.strengths,
  );
  const updatedAreas = existingAnalytics.areas_for_improvement_summary.filter(
    (a: string) => a !== deletedInterviewEvaluation.areas_for_improvement,
  );
  const updatedRecommendations =
    existingAnalytics.recommendations_summary.filter(
      (r: string) => r !== deletedInterviewEvaluation.recommendations,
    );

  const { error: updateError } = await supabase
    .from('interview_analytics')
    .update({
      total_interviews: newTotal,
      avg_overall_grade: newAvgOverall,
      avg_evaluation_criteria: updatedEvalCriteria,
      strengths_summary:
        updatedStrengths.length > 0
          ? updatedStrengths
          : ['No strengths available.'],
      areas_for_improvement_summary:
        updatedAreas.length > 0
          ? updatedAreas
          : ['No areas for improvement available.'],
      recommendations_summary:
        updatedRecommendations.length > 0
          ? updatedRecommendations
          : ['No recommendations available.'],
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingAnalytics.id);

  if (updateError) {
    console.error('Error updating periodic analytics:', updateError.message);
    throw updateError;
  }
  return 'Analytics record updated';
};

export const getInterviewAnalytics = async (
  candidateId: string,
  templateId: string,
): Promise<Table<'interview_analytics'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('template_id', templateId)
    .maybeSingle();

  if (error) {
    // Log invalid query or missing data errors
    console.warn('Error fetching interview analytics:', error.message);
    throw error;
  }

  return data;
};

export const getInterviewHistory = async (
  candidateId: string,
): Promise<Table<'interviews'>[] | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId);

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (error) {
    throw error;
  }

  return data;
};

export const getInterviewById = async (
  interviewId: string,
): Promise<Table<'interviews'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('id', interviewId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getInterviewEvaluation = async (
  interviewId: string,
): Promise<Table<'interview_evaluations'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_evaluations')
    .select('*')
    .eq('interview_id', interviewId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const getTotalCompletedInterviews = async (
  candidateId: string,
): Promise<Table<'interviews'>[] | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('status', 'completed');

  if (error) {
    // PGRST116: No rows found
    if (error.code !== 'PGRST116') {
      console.error(
        'Could not find total completed interviews for candidate ID:' +
        candidateId,
        error.message,
      );
      return null;
    }
    throw error;
  }
  return data;
};

export const getCompletedInterviewsByTemplate = async (
  candidateId: string,
  templateId: string,
): Promise<Table<'interviews'>[] | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('status', 'completed')
    .eq('template_id', templateId);

  if (error) {
    // PGRST116: No rows found
    if (error.code !== 'PGRST116') {
      console.error(
        'Could not find completed interviews for template ID' +
        templateId +
        ' + candidateId' +
        candidateId,
        error.message,
      );
      return null;
    }
    throw error;
  }

  return data;
};

export const getInterviewEvaluations = async (
  completedInterviewsIds: string[],
): Promise<Table<'interview_evaluations'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();

  const { data, error } = await supabase
    .from('interview_evaluations')
    .select('*')
    .in('interview_id', completedInterviewsIds);

  if (error) {
    throw error;
  }

  return data;
};

export const getLatestInterviewCompleted = async (
  candidateId: string,
): Promise<Table<'interviews'> | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('status', 'completed')
    .order('end_time', { ascending: false })
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};
