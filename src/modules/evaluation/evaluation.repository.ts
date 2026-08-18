import 'server-only';

import { and, eq, inArray } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import {
  responseEvaluations,
  sessionEvaluations,
} from '@/db/schema/evaluations';
import { sessionResponses } from '@/db/schema/sessions';
import {
  responseEvaluationSchema,
  sessionEvaluationSchema,
  type EvaluationRepository,
  type ResponseEvaluation,
  type SessionEvaluation,
} from '@/modules/evaluation/evaluation.schema';

type ResponseEvaluationRow = typeof responseEvaluations.$inferSelect;
type SessionEvaluationRow = typeof sessionEvaluations.$inferSelect;

function mapResponseEvaluation(row: ResponseEvaluationRow): ResponseEvaluation {
  return responseEvaluationSchema.parse({
    id: row.id,
    sessionResponseId: row.responseId,
    overallScore: Number(row.overallScore),
    criterionScores: row.criterionScores,
    summary: row.summary,
    strengths: row.strengths,
    improvements: row.improvements,
    recommendation: row.recommendation,
    schemaVersion: row.schemaVersion,
    modelMetadata: row.modelMetadata,
    createdAt: row.createdAt,
  });
}

function mapSessionEvaluation(row: SessionEvaluationRow): SessionEvaluation {
  return sessionEvaluationSchema.parse({
    id: row.id,
    sessionId: row.sessionId,
    overallScore: Number(row.overallScore),
    criterionScores: row.criterionScores,
    summary: row.summary,
    strengths: row.strengths,
    improvements: row.improvements,
    recommendation: row.recommendation,
    schemaVersion: row.schemaVersion,
    modelMetadata: row.modelMetadata,
    createdAt: row.createdAt,
  });
}

/**
 * Schema-versioned evaluation persistence.
 *
 * The SQL baseline owns unique (response_id, schema_version) and
 * (session_id, schema_version) constraints. Inserts use conflict-do-nothing so
 * concurrent report loads cannot overwrite an evaluation that another request
 * has already committed for the same scoring schema.
 */
export class DrizzleEvaluationRepository implements EvaluationRepository {
  constructor(private readonly database: InterviewGradeDatabase = db) {}

  async getResponseEvaluation(
    responseId: string,
    schemaVersion: string,
  ): Promise<ResponseEvaluation | null> {
    const [row] = await this.database
      .select()
      .from(responseEvaluations)
      .where(
        and(
          eq(responseEvaluations.responseId, responseId),
          eq(responseEvaluations.schemaVersion, schemaVersion),
        ),
      )
      .limit(1);

    return row ? mapResponseEvaluation(row) : null;
  }

  async getSessionEvaluation(
    sessionId: string,
    schemaVersion: string,
  ): Promise<SessionEvaluation | null> {
    const [row] = await this.database
      .select()
      .from(sessionEvaluations)
      .where(
        and(
          eq(sessionEvaluations.sessionId, sessionId),
          eq(sessionEvaluations.schemaVersion, schemaVersion),
        ),
      )
      .limit(1);

    return row ? mapSessionEvaluation(row) : null;
  }

  async listSessionResponseEvaluations(
    sessionId: string,
    schemaVersion: string,
  ): Promise<ResponseEvaluation[]> {
    const responseRows = await this.database
      .select({ id: sessionResponses.id })
      .from(sessionResponses)
      .where(eq(sessionResponses.sessionId, sessionId));

    if (responseRows.length === 0) {
      return [];
    }

    const rows = await this.database
      .select()
      .from(responseEvaluations)
      .where(
        and(
          inArray(
            responseEvaluations.responseId,
            responseRows.map((response) => response.id),
          ),
          eq(responseEvaluations.schemaVersion, schemaVersion),
        ),
      );

    return rows.map(mapResponseEvaluation);
  }

  async saveResponseEvaluation(
    evaluation: ResponseEvaluation,
  ): Promise<ResponseEvaluation> {
    const parsed = responseEvaluationSchema.parse(evaluation);

    const [inserted] = await this.database
      .insert(responseEvaluations)
      .values({
        id: parsed.id,
        responseId: parsed.sessionResponseId,
        overallScore: parsed.overallScore.toFixed(2),
        criterionScores: parsed.criterionScores,
        summary: parsed.summary ?? null,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        recommendation: parsed.recommendation,
        schemaVersion: parsed.schemaVersion,
        modelMetadata: parsed.modelMetadata,
        createdAt: parsed.createdAt,
      })
      .onConflictDoNothing({
        target: [responseEvaluations.responseId, responseEvaluations.schemaVersion],
      })
      .returning();

    if (inserted) {
      return mapResponseEvaluation(inserted);
    }

    const existing = await this.getResponseEvaluation(
      parsed.sessionResponseId,
      parsed.schemaVersion,
    );
    if (!existing) {
      throw new Error('Response evaluation conflicted but could not be reloaded.');
    }

    return existing;
  }

  async saveSessionEvaluation(
    evaluation: SessionEvaluation,
  ): Promise<SessionEvaluation> {
    const parsed = sessionEvaluationSchema.parse(evaluation);

    const [inserted] = await this.database
      .insert(sessionEvaluations)
      .values({
        id: parsed.id,
        sessionId: parsed.sessionId,
        overallScore: parsed.overallScore.toFixed(2),
        criterionScores: parsed.criterionScores,
        summary: parsed.summary ?? null,
        strengths: parsed.strengths,
        improvements: parsed.improvements,
        recommendation: parsed.recommendation,
        schemaVersion: parsed.schemaVersion,
        modelMetadata: parsed.modelMetadata,
        createdAt: parsed.createdAt,
      })
      .onConflictDoNothing({
        target: [sessionEvaluations.sessionId, sessionEvaluations.schemaVersion],
      })
      .returning();

    if (inserted) {
      return mapSessionEvaluation(inserted);
    }

    const existing = await this.getSessionEvaluation(
      parsed.sessionId,
      parsed.schemaVersion,
    );
    if (!existing) {
      throw new Error('Session evaluation conflicted but could not be reloaded.');
    }

    return existing;
  }
}

export function createDrizzleEvaluationRepository(
  database: InterviewGradeDatabase = db,
): EvaluationRepository {
  return new DrizzleEvaluationRepository(database);
}
