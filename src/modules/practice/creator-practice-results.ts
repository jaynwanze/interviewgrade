import 'server-only';

import { and, desc, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { sessionEvaluations } from '@/db/schema/evaluations';
import { practices, practiceVersions } from '@/db/schema/practices';
import { sessions } from '@/db/schema/sessions';
import { SESSION_EVALUATION_SCHEMA_VERSION } from '@/modules/evaluation/evaluation.service';
import type { SessionStatus } from '@/modules/session/session.schema';

export type CreatorPracticeResultAttempt = {
  sessionId: string;
  practiceVersion: number;
  participantUserId: string | null;
  participantName: string | null;
  participantEmail: string | null;
  status: SessionStatus;
  currentQuestionOrder: number;
  overallScore: number | null;
  hasReport: boolean;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

export type CreatorPracticeResults = {
  practice: {
    id: string;
    title: string;
    status: string;
    shareSlug: string | null;
  };
  attempts: CreatorPracticeResultAttempt[];
};

export async function getCreatorPracticeResults(
  practiceId: string,
  creatorUserId: string,
  database: InterviewGradeDatabase = db,
): Promise<CreatorPracticeResults | null> {
  const [practice] = await database
    .select({
      id: practices.id,
      title: practices.title,
      status: practices.status,
      shareSlug: practices.shareSlug,
    })
    .from(practices)
    .where(
      and(eq(practices.id, practiceId), eq(practices.createdBy, creatorUserId)),
    )
    .limit(1);

  if (!practice) {
    return null;
  }

  const rows = await database
    .select({
      sessionId: sessions.id,
      practiceVersion: practiceVersions.version,
      participantUserId: sessions.participantUserId,
      participantName: sessions.participantName,
      participantEmail: sessions.participantEmail,
      status: sessions.status,
      currentQuestionOrder: sessions.currentQuestionPosition,
      overallScore: sessionEvaluations.overallScore,
      reportId: sessionEvaluations.id,
      startedAt: sessions.startedAt,
      completedAt: sessions.completedAt,
      createdAt: sessions.createdAt,
    })
    .from(sessions)
    .innerJoin(
      practiceVersions,
      eq(sessions.practiceVersionId, practiceVersions.id),
    )
    .leftJoin(
      sessionEvaluations,
      and(
        eq(sessionEvaluations.sessionId, sessions.id),
        eq(
          sessionEvaluations.schemaVersion,
          SESSION_EVALUATION_SCHEMA_VERSION,
        ),
      ),
    )
    .where(eq(sessions.practiceId, practiceId))
    .orderBy(desc(sessions.createdAt));

  return {
    practice,
    attempts: rows.map((row) => ({
      sessionId: row.sessionId,
      practiceVersion: row.practiceVersion,
      participantUserId: row.participantUserId,
      participantName: row.participantName,
      participantEmail: row.participantEmail,
      status: row.status as SessionStatus,
      currentQuestionOrder: row.currentQuestionOrder,
      overallScore:
        row.overallScore == null ? null : Number(row.overallScore),
      hasReport: row.reportId != null,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      createdAt: row.createdAt,
    })),
  };
}

export async function creatorOwnsPracticeSession(
  practiceId: string,
  sessionId: string,
  creatorUserId: string,
  database: InterviewGradeDatabase = db,
): Promise<boolean> {
  const [row] = await database
    .select({ sessionId: sessions.id })
    .from(sessions)
    .innerJoin(practices, eq(sessions.practiceId, practices.id))
    .where(
      and(
        eq(sessions.id, sessionId),
        eq(sessions.practiceId, practiceId),
        eq(practices.createdBy, creatorUserId),
      ),
    )
    .limit(1);

  return Boolean(row);
}
