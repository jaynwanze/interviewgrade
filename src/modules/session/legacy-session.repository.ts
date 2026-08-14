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

export type LegacySessionProgressUpdate = {
  sessionId: string;
  nextQuestionIndex: number;
  status: 'in_progress' | 'completed';
};

/**
 * Transitional repository contract for the current interview-backed runtime.
 *
 * This intentionally does not implement the final v2 SessionRepository yet.
 * Legacy rows are still interview/template based, while the v2 domain is
 * PracticeVersion/Session/SessionResponse based. Keeping this adapter explicit
 * lets application actions become persistence-agnostic without inventing
 * lossy mappings that would hide the real migration work.
 */
export interface LegacySessionRepository {
  start(
    template: PracticeTemplate | InterviewTemplate,
    interviewMode: InterviewModeType,
  ): Promise<Table<'interviews'>>;
  getSnapshot(sessionId: string): Promise<LegacySessionSnapshot | null>;
  saveResponse(
    questionId: string,
    transcript: string,
  ): Promise<Table<'interview_answers'>>;
  updateProgress(
    input: LegacySessionProgressUpdate,
  ): Promise<Table<'interviews'>>;
}

class LegacyInterviewSessionRepository implements LegacySessionRepository {
  start(
    template: PracticeTemplate | InterviewTemplate,
    interviewMode: InterviewModeType,
  ) {
    return startInterviewAction(template, interviewMode);
  }

  async getSnapshot(sessionId: string): Promise<LegacySessionSnapshot | null> {
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

  saveResponse(questionId: string, transcript: string) {
    return insertInterviewAnswer(questionId, transcript);
  }

  updateProgress(input: LegacySessionProgressUpdate) {
    return updateInterview({
      id: input.sessionId,
      status: input.status,
      current_question_index: input.nextQuestionIndex,
      ...(input.status === 'completed' && {
        end_time: new Date().toISOString(),
      }),
    });
  }
}

export const legacySessionRepository: LegacySessionRepository =
  new LegacyInterviewSessionRepository();
