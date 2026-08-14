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

export type SaveLegacySessionResponseInput = {
  questionId: string;
  transcript: string;
};

export type UpdateLegacySessionProgressInput = {
  sessionId: string;
  nextQuestionIndex: number;
  status: 'in_progress' | 'completed';
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
 * Persist a response without changing session progress.
 *
 * Practice mode intentionally needs this separation because it records the
 * answer, streams feedback, and only then advances the visible question.
 */
export async function saveLegacySessionResponseAction(
  input: SaveLegacySessionResponseInput,
): Promise<Table<'interview_answers'>> {
  if (!input.transcript.trim()) {
    throw new Error('A session response cannot be empty.');
  }

  return insertInterviewAnswer(input.questionId, input.transcript);
}

/**
 * Update progress independently from response persistence so the current
 * practice and mock flows keep their existing sequencing during migration.
 */
export async function updateLegacySessionProgressAction(
  input: UpdateLegacySessionProgressInput,
): Promise<Table<'interviews'>> {
  if (input.nextQuestionIndex < 0) {
    throw new Error('Invalid session progress.');
  }

  return updateInterview({
    id: input.sessionId,
    status: input.status,
    current_question_index: input.nextQuestionIndex,
    ...(input.status === 'completed' && {
      end_time: new Date().toISOString(),
    }),
  });
}

/**
 * Persist one response and advance session progress as one application-level
 * operation. Kept for callers that do not need the split sequencing above.
 */
export async function submitLegacySessionResponseAction(
  input: SubmitLegacySessionResponseInput,
): Promise<Table<'interviews'>> {
  if (
    input.nextQuestionIndex < 0 ||
    input.nextQuestionIndex > input.questionCount
  ) {
    throw new Error('Invalid session progress.');
  }

  await saveLegacySessionResponseAction({
    questionId: input.questionId,
    transcript: input.transcript,
  });

  const status: 'in_progress' | 'completed' =
    input.nextQuestionIndex < input.questionCount ? 'in_progress' : 'completed';

  return updateLegacySessionProgressAction({
    sessionId: input.sessionId,
    nextQuestionIndex: input.nextQuestionIndex,
    status,
  });
}
