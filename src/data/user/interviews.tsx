'use server';
import {
  getInterviewEvaluationCriteriasByTemplate,
  getPracticeTemplateEvaluationsByTemplateId,
  getPracticeTemplateQuestionByTemplateId,
  getPracticeTemplateQuestionsByTemplateIdAndEvalCriteria,
  getTemplateImgUrlById,
} from '@/data/user/templates';
import { getCandidateUserProfile } from '@/data/user/user';
import { createSupabaseUserServerComponentClient } from '@/supabase-clients/user/createSupabaseUserServerComponentClient';
import type {
  AvgEvaluationScores,
  Candidate,
  CandidateSkillsStats,
  ChatRow,
  EvaluationCriteriaType,
  FeedbackData,
  Interview,
  InterviewAnalytics,
  InterviewEvaluation,
  InterviewEvaluationCriteriaType,
  InterviewModeType,
  InterviewQuestion,
  InterviewTemplate,
  InterviewUpdate,
  PracticeTemplate,
  SAPayload,
  Table,
} from '@/types';
import { getRandomElements } from '@/utils/getRandomElements';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';
import { randomUUID } from 'crypto';
import moment from 'moment';

/**
 * This action starts an interview or practice session (depending on interviewMode).
 * It checks tokens before creating the session and deducts tokens if successful.
 *
 * @param template - The practice or interview template to use
 * @param interviewMode - 'practice' or 'interview'
 * @returns The newly created interview row
 */
export async function startInterviewAction(
  template: PracticeTemplate | InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> {
  //Get current user
  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('User is not logged in.');
  }

  //Get candidate
  const candidateProfile = await getCandidateUserProfile(user.id);
  if (!candidateProfile) {
    throw new Error('Candidate profile not found.');
  }

  const supabase = createSupabaseUserServerComponentClient();
  // Create the session
  let newInterview: Table<'interviews'>;
  if (interviewMode === 'practice') {
    // Typecast because TypeScript doesn’t know if template is a PracticeTemplate or InterviewTemplate
    newInterview = await createPracticeSession(
      template as PracticeTemplate,
      interviewMode,
    );
  } else {
    newInterview = await createInterviewSession(
      template as InterviewTemplate,
      interviewMode,
    );
  }

  if (!newInterview) {
    throw new Error('Failed to create interview session.');
  }

  //Return the newly created interview row
  return newInterview;
}

export const createPracticeSession = async (
  practiceTemplate: PracticeTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> => {
  const supabase = createSupabaseUserServerComponentClient();
  const user = await serverGetLoggedInUser();
  const candidateProfile = await getCandidateUserProfile(user.id);
  const candidateProfileId = candidateProfile.id;
  const practiceTemplateEvaluationCriterias =
    await getPracticeTemplateEvaluationsByTemplateId(practiceTemplate.id);

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
      evaluation_criterias: practiceTemplateEvaluationCriterias,
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

  await createPracticeModeQuestions(
    data[0].id,
    practiceTemplate,
    practiceTemplateEvaluationCriterias,
  );
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
    await getInterviewEvaluationCriteriasByTemplate(interviewTemplate.id);

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

  await createInterviewModeQuestions(data[0].id, templateEvaluationCriterias);
  return data[0];
};

export const createPracticeModeQuestions = async (
  interviewId: string,
  practiceTemplate: PracticeTemplate,
  practiceTemplateEvaluationCriterias: EvaluationCriteriaType[],
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  if (
    !practiceTemplateEvaluationCriterias ||
    practiceTemplateEvaluationCriterias.length === 0
  ) {
    throw new Error('Failed to fetch practice template evaluation criterias');
  }

  const questionsToInsert: Table<'interview_questions'>[] = [];

  // Fetch practice evaluation criterias linked to this interview evaluation criteria
  for (const criteria of practiceTemplateEvaluationCriterias) {
    if (!criteria.rubrics || criteria.rubrics.length === 0) {
      throw new Error(
        `Rubrics not found for evaluation criteria ${criteria.id}`,
      );
    }

    const tempQuestions =
      await getPracticeTemplateQuestionsByTemplateIdAndEvalCriteria(
        practiceTemplate.id,
        criteria.id,
      );

    if (!tempQuestions || tempQuestions.length === 0) {
      console.warn(`No questions found for evaluation criteria ${criteria.id}`);
      continue;
    }

    const selectedQuestions = getRandomElements(tempQuestions, 1);

    selectedQuestions.forEach((randomQuestion) => {
      if (!randomQuestion) {
        console.warn('Random question selection failed.');
        return;
      }

      const interviewQuestion: InterviewQuestion = {
        id: crypto.randomUUID(),
        interview_id: interviewId,
        type: randomQuestion.type,
        text: randomQuestion.text,
        evaluation_criteria: criteria,
        sample_answer: randomQuestion.sample_answer,
      };

      questionsToInsert.push(interviewQuestion);
    });
  }

  if (questionsToInsert.length === 0) {
    return {
      status: 'error',
      message: 'No interview questions were prepared for insertion.',
    };
  }

  const { data, error } = await supabase
    .from('interview_questions')
    .insert(questionsToInsert)
    .select('*');

  if (error) {
    throw error;
  }

  return {
    status: 'success',
    data: data[0], // All inserted questions
  };
};
export const createInterviewModeQuestions = async (
  interviewId: string,
  interviewTemplateEvaluationCriterias: InterviewEvaluationCriteriaType[],
): Promise<SAPayload<Table<'interview_questions'>>> => {
  const supabase = createSupabaseUserServerComponentClient();

  if (
    !interviewTemplateEvaluationCriterias ||
    interviewTemplateEvaluationCriterias.length === 0
  ) {
    throw new Error('Failed to fetch interview template evaluation criterias');
  }

  const questionsToInsert: InterviewQuestion[] = [];

  // Select 4 random practice evaluation criterias
  const selectedInterviewTemplateEvaluationCriterias = getRandomElements(
    interviewTemplateEvaluationCriterias,
    4,
  );

  // fetch practice eval/questions linked to this interview evaluation criteria
  for (const selectedInterviewTemplateEvalCriteria of selectedInterviewTemplateEvaluationCriterias) {
    if (
      !selectedInterviewTemplateEvalCriteria.rubrics ||
      selectedInterviewTemplateEvalCriteria.rubrics.length === 0
    ) {
      console.warn(
        `Rubrics not found for evaluation criteria ${selectedInterviewTemplateEvalCriteria.id}`,
      );
      continue;
    }
  }

  //For each selected evaluation criteria, fetch practice questions linked to this evaluation criteria
  for (const interviewTemplateCriteria of interviewTemplateEvaluationCriterias) {
    if (
      !interviewTemplateCriteria.rubrics ||
      interviewTemplateCriteria.rubrics.length === 0
    ) {
      console.warn(
        `Rubrics not found for evaluation criteria ${interviewTemplateCriteria.id}`,
      );
      continue;
    }

    //Check if interview evaluation criteria has linked practice questions
    if (!interviewTemplateCriteria.template_id) {
      console.warn(
        `Template ID not found for interview evaluation criteria ${interviewTemplateCriteria.id}`,
      );
      continue;
    }

    //Get practice questions linked to this interview evaluation criteria and pracetice template
    const questions = await getPracticeTemplateQuestionByTemplateId(
      interviewTemplateCriteria.template_id,
    );

    //Randomise 2 questions for each evaluation criteria
    const selectedQuestions = getRandomElements(questions, 2);

    //For each selected question, create an interview question
    selectedQuestions.forEach((randomQuestion) => {
      if (!randomQuestion) {
        console.warn('Random question selection failed.');
        return;
      }

      const interviewQuestion: InterviewQuestion = {
        id: crypto.randomUUID(),
        interview_id: interviewId,
        type: randomQuestion.type,
        text: randomQuestion.text,
        evaluation_criteria: interviewTemplateCriteria,
        sample_answer: randomQuestion.sample_answer,
      };

      //Add the interview question to the list of questions to insert
      questionsToInsert.push(interviewQuestion);
    });
  }

  if (questionsToInsert.length === 0) {
    return {
      status: 'error',
      message: 'No interview questions were prepared for insertion.',
    };
  }

  //Insert into interview_questions interview evaluation criteria with linked practice question details
  const { data, error } = await supabase
    .from('interview_questions')
    .insert(questionsToInsert)
    .select('*');

  if (error) {
    throw error;
  }

  return {
    status: 'success',
    data: data[0],
  };
};

export const getRecentInterviews = async (): Promise<Table<'interviews'>[]> => {
  const user = await serverGetLoggedInUser();
  if (!user) {
    throw new Error('User is not logged in.');
  }
  const candidateProfile = await getCandidateUserProfile(user.id);
  if (!candidateProfile) {
    throw new Error('Candidate profile not found.');
  }

  const supabase = createSupabaseUserServerComponentClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateProfile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    throw error;
  }

  return data;
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

export async function saveChatMessage(
  interviewEvalId: string,
  sender: 'user' | 'assistant',
  text: string,
): Promise<void> {
  const supabase = createSupabaseUserServerComponentClient();

  const newRow: ChatRow = {
    id: randomUUID(),
    sender,
    text,
    created_at: new Date().toISOString(),
  };

  const { data: current, error: readErr } = await supabase
    .from('interview_evaluations')
    .select('chat_messages')
    .eq('id', interviewEvalId)
    .single();

  if (readErr) throw new Error(readErr.message);

  const currentArray: ChatRow[] = current?.chat_messages ?? [];

  const { error: writeErr } = await supabase
    .from('interview_evaluations')
    .update({ chat_messages: [...currentArray, newRow] })
    .eq('id', interviewEvalId);

  if (writeErr) throw new Error(writeErr.message);
}

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
  currentTemplateId: string,
  interviewMode: string,
): Promise<InterviewAnalytics | null> => {
  const supabase = createSupabaseUserServerComponentClient();

  if (!candidateId) {
    console.warn('Candidate ID not found.');
    return null;
  } else if (!currentTemplateId) {
    console.warn('Current Template ID not found.');
    return null;
  }

  // Fetch completed interviews for the candidate and template id
  // Determine the template ID and column name
  const templateColumn =
    interviewMode === 'Practice Mode' ? 'template_id' : 'interview_template_id';

  const { data: interviews, error: interviewError } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq(templateColumn, currentTemplateId)
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

  if (!evaluations || evaluations.length === 0) {
    console.warn('No evaluations found.');
    return null;
  }

  // Aggregate data
  const totalInterviews = interviews.length;

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

  //Get the best evaluation criteria
  const bestEvaluationCriteria = avgEvaluationCriteriaScores.reduce(
    (prev, current) => (prev.avg_score > current.avg_score ? prev : current),
  );

  const templateImgUrl = await getTemplateImgUrlById(
    currentTemplateId,
    interviewMode,
  );

  // Assuming all interviews have the same title and description
  const {
    title: interviewTitle,
    description: interviewDescription,
    question_count: interviewQuestionCount,
  } = interviews[0];
  if (interviewMode === 'Practice Mode') {
    return {
      template_id: currentTemplateId,
      interview_template_id: null,
      interview_title: interviewTitle,
      interview_description: interviewDescription,
      total_interviews: totalInterviews,
      question_count: interviewQuestionCount,
      avg_overall_grade: avgOverallGrade,
      avg_evaluation_criteria_scores: avgEvaluationCriteriaScores,
      strengths_summary: strengthsSummary,
      areas_for_improvement_summary: areasForImprovementSummary,
      recommendations_summary: recommendationsSummary,
      completed_interview_evaluations: evaluations,
      best_evaluation_crieria: bestEvaluationCriteria.name,
      img_url: templateImgUrl,
    };
  } else {
    return {
      template_id: null,
      interview_template_id: currentTemplateId,
      interview_title: interviewTitle,
      interview_description: interviewDescription,
      total_interviews: totalInterviews,
      question_count: interviewQuestionCount,
      avg_overall_grade: avgOverallGrade,
      avg_evaluation_criteria_scores: avgEvaluationCriteriaScores,
      strengths_summary: strengthsSummary,
      areas_for_improvement_summary: areasForImprovementSummary,
      recommendations_summary: recommendationsSummary,
      completed_interview_evaluations: evaluations,
      best_evaluation_crieria: bestEvaluationCriteria.name,
      img_url: templateImgUrl,
    };
  }
};

export const updateInterviewAnalyticsCurrentAvgPractice = async (
  candidateId: string,
  currentTemplateId: string,
  skill: string,
): Promise<boolean> => {
  const supabase = createSupabaseUserServerComponentClient();

  // 1. Fetch completed interviews for this candidate and template.
  const { data: interviewIds, error: interviewIdsError } = await supabase
    .from('interviews')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('status', 'completed')
    .eq('template_id', currentTemplateId)
    .order('created_at', { ascending: false });

  if (interviewIdsError) {
    console.warn('Error fetching interview IDs:', interviewIdsError.message);
    return false;
  }
  if (!interviewIds || interviewIds.length === 0) {
    console.warn('No interviews found for candidate:', candidateId);
    return false;
  }

  const interviewIdsArray = interviewIds.map(
    (interview: Interview) => interview.id,
  );

  // 2. Fetch evaluations for these interviews.
  const { data: evaluations, error: evaluationsError } = await supabase
    .from('interview_evaluations')
    .select('*')
    .in('interview_id', interviewIdsArray);

  if (evaluationsError) {
    console.warn('Error fetching evaluations:', evaluationsError.message);
    return false;
  }
  if (!evaluations || evaluations.length === 0) {
    console.warn('No evaluations found for candidate:', candidateId);
    return false;
  }

  // 3. Calculate the current overall grade (average) from evaluations.
  const currentOverallGrade =
    evaluations.reduce(
      (acc: number, evalItem: InterviewEvaluation) =>
        acc + evalItem.overall_grade,
      0,
    ) / evaluations.length;

  // 4. Fetch the candidate profile.
  const candidateProfile = (await getCandidateUserProfile(
    candidateId,
  )) as Candidate;
  if (!candidateProfile) {
    console.warn('Error fetching candidate profile:', candidateId);
    return false;
  }

  // 5. Update practice_skill_stats: for entries matching currentTemplateId,
  // set previous_avg to current avg_score, and current_avg to the new overall grade.
  let exists = false;

  if (!candidateProfile.practice_skill_stats) {
    candidateProfile.practice_skill_stats = [];
  }

  const new_skills_stats: CandidateSkillsStats[] =
    candidateProfile.practice_skill_stats.map((skill: CandidateSkillsStats) => {
      if (skill.template_id === currentTemplateId) {
        exists = true;
        return {
          ...skill,
          previous_avg: skill.avg_score,
          avg_score: currentOverallGrade,
        };
      }
      return skill;
    });

  if (!exists) {
    new_skills_stats.push({
      template_id: currentTemplateId,
      skill: skill,
      previous_avg: 0,
      avg_score: currentOverallGrade,
    });
  }

  // 6. Update the candidate profile in the database.
  const { error: updateError } = await supabase
    .from('candidates')
    .update({ practice_skill_stats: new_skills_stats })
    .eq('id', candidateId);

  if (updateError) {
    console.warn('Error updating candidate profile:', updateError.message);
    return false;
  }

  console.log(`Candidate ${candidateId} practice stats updated successfully.`);
  return true;
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
