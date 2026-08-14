import 'server-only';

import { asc, and, eq } from 'drizzle-orm';

import { db, type InterviewGradeDatabase } from '@/db/client';
import {
  practiceQuestions,
  practiceVersions,
  rubricCriteria,
} from '@/db/schema/practices';
import {
  practiceDraftSchema,
  practiceVersionSchema,
  type PracticeVersion,
} from '@/modules/practice/practice.schema';

/**
 * Read one immutable published practice snapshot by version id.
 *
 * Session runtime uses this rather than the stable practice's mutable draft
 * pointer so historical/in-flight sessions always see exactly what was
 * published when the session was created.
 */
export async function getPublishedPracticeVersionById(
  id: string,
  database: InterviewGradeDatabase = db,
): Promise<PracticeVersion | null> {
  const [version] = await database
    .select()
    .from(practiceVersions)
    .where(
      and(
        eq(practiceVersions.id, id),
        eq(practiceVersions.state, 'published'),
      ),
    )
    .limit(1);

  if (!version || !version.publishedAt) {
    return null;
  }

  const [questions, criteria] = await Promise.all([
    database
      .select()
      .from(practiceQuestions)
      .where(eq(practiceQuestions.practiceVersionId, version.id))
      .orderBy(asc(practiceQuestions.position)),
    database
      .select()
      .from(rubricCriteria)
      .where(eq(rubricCriteria.practiceVersionId, version.id))
      .orderBy(asc(rubricCriteria.position)),
  ]);

  const snapshot = practiceDraftSchema.parse({
    title: version.title,
    description: version.description,
    scenario: version.scenario,
    instructions: version.instructions,
    difficulty: version.difficulty,
    estimatedDurationMinutes: version.estimatedDurationMinutes,
    questions: questions.map((question) => ({
      id: question.id,
      order: question.position,
      prompt: question.prompt,
      guidance: question.guidance,
      preparationSeconds: question.preparationSeconds,
      responseSeconds: question.maxResponseSeconds,
    })),
    rubricCriteria: criteria.map((criterion) => ({
      id: criterion.id,
      order: criterion.position,
      name: criterion.name,
      description: criterion.description,
      weight: Number(criterion.weight),
    })),
  });

  return practiceVersionSchema.parse({
    id: version.id,
    practiceId: version.practiceId,
    version: version.version,
    publishedAt: version.publishedAt,
    snapshot,
  });
}
