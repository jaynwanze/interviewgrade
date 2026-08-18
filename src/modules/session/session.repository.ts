import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

import { db, type InterviewGradeDatabase } from '@/db/client';
import { practiceQuestions, practices, practiceVersions } from '@/db/schema/practices';
import { sessionResponses, sessions } from '@/db/schema/sessions';
import {
  sessionResponseSchema,
  sessionSchema,
  type CreateSessionInput,
  type Session,
  type SessionRepository,
  type SessionResponse,
  type SubmitSessionResponseInput,
} from '@/modules/session/session.schema';

const createSessionInputSchema = z.object({
  practiceVersionId: z.string().min(1),
  participantUserId: z.string().min(1).optional().nullable(),
  participantName: z.string().trim().min(1).max(160).optional().nullable(),
  participantEmail: z.string().trim().email().max(320).optional().nullable(),
});

const submitResponseInputSchema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  questionOrder: z.number().int().nonnegative(),
  transcript: z.string().refine((value) => value.trim().length > 0, {
    message: 'Transcript cannot be blank.',
  }),
  audioStoragePath: z.string().min(1).optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
});

type SessionRow = typeof sessions.$inferSelect;
type SessionResponseRow = typeof sessionResponses.$inferSelect;

function mapSession(row: SessionRow): Session {
  return sessionSchema.parse({
    id: row.id,
    practiceVersionId: row.practiceVersionId,
    participantUserId: row.participantUserId,
    participantName: row.participantName,
    participantEmail: row.participantEmail,
    status: row.status,
    currentQuestionOrder: row.currentQuestionPosition,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function mapResponse(row: SessionResponseRow): SessionResponse {
  return sessionResponseSchema.parse({
    id: row.id,
    sessionId: row.sessionId,
    questionId: row.questionId,
    questionOrder: row.questionPosition,
    transcript: row.transcript,
    audioStoragePath: row.audioObjectPath,
    durationSeconds: row.durationSeconds,
    attemptNumber: row.attemptNumber,
    submittedAt: row.submittedAt,
  });
}

/**
 * Drizzle-backed v2 session persistence.
 *
 * Session creation is deliberately restricted to the stable practice's current
 * published version. Once created, the session keeps that immutable version id
 * forever, so later creator publishes cannot change an in-flight or historical
 * learner session.
 */
export class DrizzleSessionRepository implements SessionRepository {
  constructor(private readonly database: InterviewGradeDatabase = db) {}

  async getById(id: string): Promise<Session | null> {
    const [row] = await this.database
      .select()
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1);

    return row ? mapSession(row) : null;
  }

  async listResponses(sessionId: string): Promise<SessionResponse[]> {
    const rows = await this.database
      .select()
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId))
      .orderBy(
        sessionResponses.questionPosition,
        sessionResponses.attemptNumber,
      );

    return rows.map(mapResponse);
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const parsed = createSessionInputSchema.parse(input);

    const created = await this.database.transaction(async (tx) => {
      const [version] = await tx
        .select({
          id: practiceVersions.id,
          practiceId: practiceVersions.practiceId,
          state: practiceVersions.state,
          publishedAt: practiceVersions.publishedAt,
        })
        .from(practiceVersions)
        .where(eq(practiceVersions.id, parsed.practiceVersionId))
        .limit(1);

      if (!version || version.state !== 'published' || !version.publishedAt) {
        throw new Error('Sessions can only be created from a published practice version.');
      }

      const [practice] = await tx
        .select({
          status: practices.status,
          currentPublishedVersionId: practices.currentPublishedVersionId,
        })
        .from(practices)
        .where(eq(practices.id, version.practiceId))
        .limit(1);

      if (
        !practice ||
        practice.status !== 'published' ||
        practice.currentPublishedVersionId !== version.id
      ) {
        throw new Error('This practice version is no longer available for new sessions.');
      }

      const [row] = await tx
        .insert(sessions)
        .values({
          practiceId: version.practiceId,
          practiceVersionId: version.id,
          participantUserId: parsed.participantUserId ?? null,
          participantName: parsed.participantName ?? null,
          participantEmail: parsed.participantEmail ?? null,
          status: 'created',
          currentQuestionPosition: 0,
        })
        .returning();

      if (!row) {
        throw new Error('Failed to create practice session.');
      }

      return row;
    });

    return mapSession(created);
  }

  async start(id: string): Promise<Session> {
    const row = await this.database.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1)
        .for('update');

      if (!existing) {
        throw new Error(`Session ${id} was not found.`);
      }

      if (existing.status === 'completed' || existing.status === 'abandoned') {
        throw new Error(`Session ${id} cannot be started from ${existing.status}.`);
      }

      if (existing.status === 'in_progress') {
        return existing;
      }

      const now = new Date();
      const [updated] = await tx
        .update(sessions)
        .set({
          status: 'in_progress',
          startedAt: existing.startedAt ?? now,
          updatedAt: now,
        })
        .where(eq(sessions.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Session ${id} could not be started.`);
      }

      return updated;
    });

    return mapSession(row);
  }

  async saveResponse(input: SubmitSessionResponseInput): Promise<SessionResponse> {
    const parsed = submitResponseInputSchema.parse(input);

    const response = await this.database.transaction(async (tx) => {
      // Lock the session so concurrent submissions for the same question cannot
      // calculate the same retry attempt number.
      const [session] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, parsed.sessionId))
        .limit(1)
        .for('update');

      if (!session) {
        throw new Error(`Session ${parsed.sessionId} was not found.`);
      }

      if (session.status !== 'in_progress') {
        throw new Error('Responses can only be submitted to an in-progress session.');
      }

      const [question] = await tx
        .select({
          id: practiceQuestions.id,
          position: practiceQuestions.position,
        })
        .from(practiceQuestions)
        .where(
          and(
            eq(practiceQuestions.id, parsed.questionId),
            eq(practiceQuestions.practiceVersionId, session.practiceVersionId),
            eq(practiceQuestions.position, parsed.questionOrder),
          ),
        )
        .limit(1);

      if (!question) {
        throw new Error('Response question does not belong to this session version.');
      }

      const [previousAttempt] = await tx
        .select({ attemptNumber: sessionResponses.attemptNumber })
        .from(sessionResponses)
        .where(
          and(
            eq(sessionResponses.sessionId, parsed.sessionId),
            eq(sessionResponses.questionId, parsed.questionId),
          ),
        )
        .orderBy(desc(sessionResponses.attemptNumber))
        .limit(1);

      const [inserted] = await tx
        .insert(sessionResponses)
        .values({
          sessionId: parsed.sessionId,
          questionId: parsed.questionId,
          questionPosition: parsed.questionOrder,
          // Preserve the exact transcript. trim() above is validation only.
          transcript: parsed.transcript,
          audioObjectPath: parsed.audioStoragePath ?? null,
          durationSeconds: parsed.durationSeconds ?? null,
          attemptNumber: (previousAttempt?.attemptNumber ?? 0) + 1,
        })
        .returning();

      if (!inserted) {
        throw new Error('Failed to save session response.');
      }

      return inserted;
    });

    return mapResponse(response);
  }

  async setCurrentQuestion(id: string, questionOrder: number): Promise<Session> {
    if (!Number.isInteger(questionOrder) || questionOrder < 0) {
      throw new Error('Current question order must be a non-negative integer.');
    }

    const row = await this.database.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1)
        .for('update');

      if (!existing) {
        throw new Error(`Session ${id} was not found.`);
      }

      if (existing.status === 'completed' || existing.status === 'abandoned') {
        throw new Error(`Session ${id} cannot change question from ${existing.status}.`);
      }

      const [question] = await tx
        .select({ id: practiceQuestions.id })
        .from(practiceQuestions)
        .where(
          and(
            eq(practiceQuestions.practiceVersionId, existing.practiceVersionId),
            eq(practiceQuestions.position, questionOrder),
          ),
        )
        .limit(1);

      if (!question) {
        throw new Error(`Question ${questionOrder} does not exist in this session version.`);
      }

      const [updated] = await tx
        .update(sessions)
        .set({ currentQuestionPosition: questionOrder, updatedAt: new Date() })
        .where(eq(sessions.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Session ${id} could not update question progress.`);
      }

      return updated;
    });

    return mapSession(row);
  }

  async complete(id: string): Promise<Session> {
    const row = await this.database.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1)
        .for('update');

      if (!existing) {
        throw new Error(`Session ${id} was not found.`);
      }

      if (existing.status === 'completed') {
        return existing;
      }
      if (existing.status === 'abandoned') {
        throw new Error('An abandoned session cannot be completed.');
      }
      if (existing.status !== 'in_progress') {
        throw new Error('A session must be in progress before it can be completed.');
      }

      const now = new Date();
      const [updated] = await tx
        .update(sessions)
        .set({ status: 'completed', completedAt: now, updatedAt: now })
        .where(eq(sessions.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Session ${id} could not be completed.`);
      }

      return updated;
    });

    return mapSession(row);
  }

  async abandon(id: string): Promise<Session> {
    const row = await this.database.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(sessions)
        .where(eq(sessions.id, id))
        .limit(1)
        .for('update');

      if (!existing) {
        throw new Error(`Session ${id} was not found.`);
      }

      if (existing.status === 'abandoned') {
        return existing;
      }
      if (existing.status === 'completed') {
        throw new Error('A completed session cannot be abandoned.');
      }

      const [updated] = await tx
        .update(sessions)
        .set({ status: 'abandoned', updatedAt: new Date() })
        .where(eq(sessions.id, id))
        .returning();

      if (!updated) {
        throw new Error(`Session ${id} could not be abandoned.`);
      }

      return updated;
    });

    return mapSession(row);
  }
}

export function createDrizzleSessionRepository(
  database: InterviewGradeDatabase = db,
): SessionRepository {
  return new DrizzleSessionRepository(database);
}
