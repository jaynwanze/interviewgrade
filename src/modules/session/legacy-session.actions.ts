'use server';

import {
  getInterview,
  getInterviewQuestions,
  insertInterviewAnswer,
  startInterviewAction,
  updateInterview,
} from '@/data/user/interviews';
import type {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
  Table,
} from '@/types';

export type LegacySessionSnapshot = {
  interview: Table<'interviews'>;
  questions: Table<'interview_questions'>[];
};

export type SubmitLegacySessionResponseInput = {
  sessionId: string;
  questionId: string;
  transcript: string;
  nextQuestionIndex: number;
  questionCount: number;
};

/**
 * Transitional application boundary for the current InterviewGrade runtime.
 *
 * The legacy UI still speaks in terms of interviews and interview_questions,
 * but it should not need to know how those records are loaded or updated.
 * Keeping that knowledge here gives the refactor a stable seam that can later
 * swap Supabase persistence for the v2 SessionRepository without redesigning
 * the interview screen.
 */
export async function startLegacySessionAction(
  template: PracticeTemplate | InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> {
  return startInterviewAction(template, interviewMode);
}

export async function loadLegacySessionAction(
  sessionId: string,
): Promise<LegacySessionSnapshot | null> {
  const interview = await getInterview(sessionId);
  if (!interview) {
    return null;
  }

  const questions = await getInterviewQuestions(sessionId);

  return {
    interview,
    questions,
  };
}

/**
 * Persist one response and advance session progress as one application-level
 * operation. The underlying legacy writes remain unchanged for now.
 */
export async function submitLegacySessionResponseAction(
  input: SubmitLegacySessionResponseInput,
): Promise<Table<'interviews'>> {
  const transcript = input.transcript.trim();
  if (!transcript) {
    throw new Error('A session response cannot be empty.');
  }

  if (
    input.nextQuestionIndex < 0 ||
    input.nextQuestionIndex > input.questionCount
  ) {
    throw new Error('Invalid session progress.');
  }

  await insertInterviewAnswer(input.questionId, transcript);

  const status: 'in_progress' | 'completed' =
    input.nextQuestionIndex < input.questionCount ? 'in_progress' : 'completed';

  return updateInterview({
    id: input.sessionId,
    status,
    current_question_index: input.nextQuestionIndex,
    ...(status === 'completed' && { end_time: new Date().toISOString() }),
  });
}
