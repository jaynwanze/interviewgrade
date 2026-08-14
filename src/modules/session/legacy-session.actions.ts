'use server';

import {
  legacySessionRepository,
  type LegacySessionSnapshot,
} from '@/modules/session/legacy-session.repository';
import type {
  InterviewModeType,
  InterviewTemplate,
  PracticeTemplate,
  Table,
} from '@/types';

export type { LegacySessionSnapshot };

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
 * The UI depends on these actions, while persistence is isolated behind the
 * legacy session repository adapter. When the v2 schema lands, the adapter can
 * be replaced incrementally without changing the active interview screens.
 */
export async function startLegacySessionAction(
  template: PracticeTemplate | InterviewTemplate,
  interviewMode: InterviewModeType,
): Promise<Table<'interviews'>> {
  return legacySessionRepository.start(template, interviewMode);
}

export async function loadLegacySessionAction(
  sessionId: string,
): Promise<LegacySessionSnapshot | null> {
  return legacySessionRepository.getSnapshot(sessionId);
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

  return legacySessionRepository.saveResponse(input.questionId, input.transcript);
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

  return legacySessionRepository.updateProgress(input);
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
