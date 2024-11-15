'use server';
import {
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
  InterviewTemplate,
  InterviewUpdate,
  QuestionAnswerFeedback,
  SAPayload,
  Table
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
  const templateEvaluationCriterias =
    await getTemplateEvaluationCriteriasJsonFormat(interviewTemplate.id);

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
      evaluation_criterias: templateEvaluationCriterias,
      start_time: moment().toISOString(), // Ensure the time is in ISO format
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

export const getInterviewAnswers = async (
  interviewId: string,
): Promise<Table<'interview_answers'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_answers')
    .select('*')
    .eq('interview_id', interviewId);

  if (error) {
    throw error;
  }

  return data;
};
*/

export const insertInterviewEvaluation = async (
  interviewId: string,
  interviewEvaluation: FeedbackData,
): Promise<Table<'interview_evaluations'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_evaluations')
    .insert({
      interview_id: interviewId,
      overall_score: interviewEvaluation.overall_score,
      evaluation_scores: interviewEvaluation.evaluation_scores,
      strengths: interviewEvaluation.strengths,
      areas_for_improvement: interviewEvaluation.areas_for_improvement,
      recommendations: interviewEvaluation.recommendations,
      question_answer_feedback: interviewEvaluation.question_answer_feedback,
    })
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateInterviewAnalytics = async (
  interview: Interview,
  interviewEvaluation: InterviewEvaluation,
): Promise<Table<'interview_analytics'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  // Determine the current period (e.g., calendar month)
  const interviewDate = moment(); // Assuming the interview is completed now; adjust if you have a specific date
  const periodStart = interviewDate
    .clone()
    .startOf('month')
    .format('YYYY-MM-DD');
  const periodEnd = interviewDate.clone().endOf('month').format('YYYY-MM-DD');

  // Fetch existing periodic analytics record
  const { data: existingAnalytics, error: fetchError } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('template_id', interview.template_id)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116: No rows found
    console.error(
      'Error fetching existing periodic analytics:',
      fetchError.message,
    );
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
      await supabase.from('interview_analytics').insert([
        {
          template_id: interview.template_id,
          candidate_id: interview.candidate_id,
          interview_title: interview.title,
          interview_description: interview.description,
          period_start: periodStart,
          period_end: periodEnd,
          total_interviews: 1,
          avg_overall_score: interviewEvaluation.overall_score,
          avg_evaluation_criteria_scores: avgEvaluationCriteriaScores(),
          strengths_summary: [interviewEvaluation.strengths],
          areas_for_improvement_summary: [
            interviewEvaluation.areas_for_improvement,
          ],
          recommendations_summary: [interviewEvaluation.recommendations],
        },
      ]);

    if (insertError) {
      console.error(
        'Error inserting new periodic analytics:',
        insertError.message,
      );
      throw insertError;
    }

    if (!updatedInterviewAnalytics) {
      throw new Error('Failed to update interview analytics');
    }
    return updatedInterviewAnalytics;
  } else {
    // Update the existing periodic analytics record
    const newTotal = existingAnalytics.total_interviews + 1;
    const newAvgOverall =
      (existingAnalytics.avg_overall_score *
        existingAnalytics.total_interviews +
        interviewEvaluation.overall_score) /
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
          avg_overall_score: newAvgOverall,
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
): Promise<string> => {
  const supabase = createSupabaseUserServerComponentClient();
  // Determine the period of the interview
  const interviewDate = moment(deletedInterviewEvaluation.created_at);
  const periodStart = interviewDate
    .clone()
    .startOf('month')
    .format('YYYY-MM-DD');
  const periodEnd = interviewDate.clone().endOf('month').format('YYYY-MM-DD');

  // Fetch existing periodic analytics record
  const { data: existingAnalytics, error: fetchError } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('template_id', interview_template_id)
    .eq('period_start', periodStart)
    .eq('period_end', periodEnd)
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
    return 'No analytics record found';
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

    return 'Analytics record deleted';
  }

  const newAvgOverall =
    (existingAnalytics.avg_overall_score * existingAnalytics.total_interviews -
      deletedInterviewEvaluation.overall_score) /
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
      avg_overall_score: newAvgOverall,
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
  templateId: string,
): Promise<Table<'interview_analytics'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_analytics')
    .select('*')
    .eq('template_id', templateId);

  if (error) {
    throw error;
  }

  return data;
};

export const getInterviewHistory = async (
  candidateId: string,
): Promise<Table<'interviews'>[]> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId);

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
    .single();

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
    .single();

  if (error) {
    throw error;
  }

  return data;
};
