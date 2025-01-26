'use server';
import {
  getPracticeTemplateEvaluationCriteriasJsonFormat,
  getInterviewTemplateEvaluationCriteriasJsonFormat,
  getPracticeTemplateQuestionByEvaluationCriteria,
  getInterviewTemplatePracticeTemplates,
} from '@/data/user/templates';
import { getCandidateUserProfile } from '@/data/user/user';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  AvgEvaluationScores,
  FeedbackData,
  InterviewAnalytics,
  InterviewComplete,
  InterviewModeType,
  InterviewTemplate,
  InterviewUpdate,
  PracticeInterviewTemplate,
  SAPayload,
  Table,
} from '@/types';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import moment from 'moment';

export const createPracticeSession = async (
  practiceTemplate: PracticeInterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const user = await serverGetLoggedInUser();
  const candidateProfile = await getCandidateUserProfile(user.id);
  const candidateProfileId = candidateProfile.id;
  const templateEvaluationCriterias =
    await getPracticeTemplateEvaluationCriteriasJsonFormat(
      practiceTemplate.id,
    );

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      candidate_id: candidateProfileId,
      template_id: practiceTemplate.id,
      title: practiceTemplate.title,
      description: practiceTemplate.description,
      mode: interviewMode,
      role: practiceTemplate.role,
      skill: practiceTemplate.skill,
      difficulty: practiceTemplate.difficulty,
      question_count: practiceTemplate.question_count,
      duration: practiceTemplate.duration,
      evaluation_criterias: templateEvaluationCriterias,
      start_time: moment().toISOString(),
      status: 'not_started',
      current_question_index: 0,
      is_general: practiceTemplate.is_general,
      is_system_defined: practiceTemplate.is_system_defined,
    })
    .select('*');
  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Failed to insert interview data');
  }

  await createPracticeModeQuestions(data[0].id, practiceTemplate);
  return data[0];
};

export const createInterviewSession = async (
  interviewTemplate: InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const user = await serverGetLoggedInUser();
  const candidateProfile = await getCandidateUserProfile(user.id);
  const candidateProfileId = candidateProfile.id;
  const templateEvaluationCriterias =
    await getInterviewTemplateEvaluationCriteriasJsonFormat(
      interviewTemplate.id,
    );

  const { data, error } = await supabase
    .from('interviews')
    .insert({
      candidate_id: candidateProfileId,
      interview_template_id: interviewTemplate.id,
      title: interviewTemplate.title,
      description: interviewTemplate.description,
      mode: interviewMode,
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

  await createInterviewModeQuestions(data[0].id, interviewTemplate);
  return data[0];
};

export const createPracticeModeQuestions = async (
  interviewId: string,
  interviewTemplate: InterviewTemplate,
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  const templateEvaluationCriterias =
    await getPracticeTemplateEvaluationCriteriasJsonFormat(
      interviewTemplate.id,
    );

  if (
    !templateEvaluationCriterias ||
    templateEvaluationCriterias.length === 0
  ) {
    throw new Error('Failed to fetch template evaluation criterias');
  }

  let lastInsertData: Table<'interview_questions'> | null = null;

  for (const criteria of templateEvaluationCriterias) {
    if (!criteria.rubrics.length || criteria.rubrics.length === 0) {
      throw new Error('Rubrics not found for evaluation criteria');
    }
    const tempQuestions = await getPracticeTemplateQuestionByEvaluationCriteria(
      interviewTemplate.id,
      criteria.id,
      interviewTemplate.question_count,
    );

    if (!tempQuestions || tempQuestions.length === 0) {
      throw new Error(
        'Failed to fetch template questions or no questions found',
      );
    }

    //randmly insert questions
    const randomQuestion =
      tempQuestions[Math.floor(Math.random() * tempQuestions.length)];

    if (!randomQuestion) {
      throw new Error('Failed to fetch random question');
    }

    const { data, error } = await supabase
      .from('interview_questions')
      .insert({
        interview_id: interviewId,
        type: randomQuestion.type,
        text: randomQuestion.text,
        evaluation_criteria: criteria,
        sample_answer: randomQuestion.sample_answer,
      })
      .select('*');

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to insert interview question data');
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
export const createInterviewModeQuestions = async (
  interviewId: string,
  interviewTemplate: InterviewTemplate,
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  const templateEvaluationCriterias =
    await getInterviewTemplateEvaluationCriteriasJsonFormat(
      interviewTemplate.id,
    );

  const practiceTemplates = await getInterviewTemplatePracticeTemplates(
    interviewTemplate.id,
  );

  if (
    !templateEvaluationCriterias ||
    templateEvaluationCriterias.length === 0
  ) {
    throw new Error('Failed to fetch template evaluation criterias');
  }

  let lastInsertData: Table<'interview_questions'> | null = null;

  for (const criteria of templateEvaluationCriterias) {
    if (!criteria.rubrics.length || criteria.rubrics.length === 0) {
      throw new Error('Rubrics not found for evaluation criteria');
    }
    const tempQuestions = await getInterviewTemplateQuestionByEvaluationCriteria(
      interviewTemplate.id,
      criteria.id,
      interviewTemplate.question_count,
    );

    if (!tempQuestions || tempQuestions.length === 0) {
      throw new Error(
        'Failed to fetch template questions or no questions found',
      );
    }

    //randmly insert questions
    const randomQuestion =
      tempQuestions[Math.floor(Math.random() * tempQuestions.length)];

    if (!randomQuestion) {
      throw new Error('Failed to fetch random question');
    }

    const { data, error } = await supabase
      .from('interview_questions')
      .insert({
        interview_id: interviewId,
        type: randomQuestion.type,
        text: randomQuestion.text,
        evaluation_criteria: criteria,
        sample_answer: randomQuestion.sample_answer,
      })
      .select('*');

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Failed to insert interview question data');
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
  mark?: number,
  feedback?: string,
): Promise<Table<'interview_answers'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interview_answers')
    .insert({
      interview_question_id: interviewQuestionId,
      text: answer,
      mark: mark,
      feedback: feedback,
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
    .single();

  if (error) {
    throw error;
  }

  return data;
};
export const getInterviewAnalytics = async (
  candidateId: string,
  templateId: string,
): Promise<InterviewAnalytics | null> => {
  const supabase = createSupabaseUserServerComponentClient();

  // Fetch completed interviews for the candidate and template
  const { data: interviews, error: interviewError } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('template_id', templateId)
    .eq('status', 'completed'); // Assuming you only want completed interviews

  if (interviewError) {
    console.warn('Error fetching interviews:', interviewError.message);
    throw interviewError;
  }

  if (!interviews || interviews.length === 0) {
    return null; // No interviews found
  }

  // Fetch evaluations for the fetched interviews
  const interviewIds = interviews.map((interview) => interview.id);
  const { data: evaluations, error: evalError } = await supabase
    .from('interview_evaluations')
    .select('*')
    .in('interview_id', interviewIds);

  if (evalError) {
    console.warn('Error fetching interview evaluations:', evalError.message);
    throw evalError;
  }

  // Aggregate data
  const totalInterviews = interviews.length;
  const totalQuestions = interviews.reduce(
    (acc, interview) => acc + interview.question_count,
    0,
  );
  const avgOverallGrade =
    evaluations.reduce((acc, evalItem) => acc + evalItem.overall_grade, 0) /
    evaluations.length;

  // Aggregate Evaluation Criteria Scores
  const criteriaMap: Record<
    string,
    { name: string; total: number; count: number; feedbacks: string[] }
  > = {};

  evaluations.forEach((evalItem) => {
    evalItem.evaluation_scores.forEach((score) => {
      if (!criteriaMap[score.id]) {
        criteriaMap[score.id] = {
          name: score.name,
          total: score.score,
          count: 1,
          feedbacks: [score.feedback],
        };
      } else {
        criteriaMap[score.id].total += score.score;
        criteriaMap[score.id].count += 1;
        criteriaMap[score.id].feedbacks.push(score.feedback);
      }
    });
  });

  const avgEvaluationCriteriaScores: AvgEvaluationScores[] = Object.values(
    criteriaMap,
  ).map((criteria) => ({
    name: criteria.name,
    avg_score: criteria.total / criteria.count,
    feedback_summary: criteria.feedbacks,
  }));

  // Aggregate Strengths, Areas for Improvement, and Recommendations
  const strengthsSummary: string[] = evaluations.map(
    (evalItem) => evalItem.strengths,
  );
  const areasForImprovementSummary: string[] = evaluations.map(
    (evalItem) => evalItem.areas_for_improvement,
  );
  const recommendationsSummary: string[] = evaluations.map(
    (evalItem) => evalItem.recommendations,
  );

  // Assuming all interviews have the same title and description
  const { title: interviewTitle, description: interviewDescription } =
    interviews[0];

  return {
    template_id: templateId,
    interview_title: interviewTitle,
    interview_description: interviewDescription,
    total_interviews: totalInterviews,
    question_count: totalQuestions,
    avg_overall_grade: avgOverallGrade,
    avg_evaluation_criteria_scores: avgEvaluationCriteriaScores,
    strengths_summary: strengthsSummary,
    areas_for_improvement_summary: areasForImprovementSummary,
    recommendations_summary: recommendationsSummary,
    completed_interview_evaluations: evaluations,
  };
};

export const getInterviewHistory = async (
  candidateId: string,
): Promise<Table<'interviews'>[] | null> => {
  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: false });

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
    console.error(
      'Error fetching total completed interviews for candidate ID:',
      candidateId,
      'Error:',
      error.message,
    );
    return null; // Return null to indicate failure
  }

  // Return the data, which could be an empty array if no interviews are found
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
    console.error(
      'Error fetching completed interviews for template ID:',
      templateId,
      'and candidate ID:',
      candidateId,
      'Error:',
      error.message,
    );
    return null; // Return null to indicate failure
  }

  // Return the data, which could be an empty array if no interviews are found
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
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    console.error(
      `Error fetching latest completed interview for candidate ID: ${candidateId}`,
      'Error Details:',
      error,
    );
    return null;
  }

  return data;
};
