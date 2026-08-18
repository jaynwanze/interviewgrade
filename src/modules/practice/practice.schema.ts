import { z } from "zod";

export const practiceStatusSchema = z.enum(["draft", "published", "archived"]);

export const practiceQuestionSchema = z.object({
  id: z.string().min(1).optional(),
  order: z.number().int().nonnegative(),
  prompt: z.string().min(1),
  guidance: z.string().optional().nullable(),
  preparationSeconds: z.number().int().nonnegative().optional().nullable(),
  responseSeconds: z.number().int().positive().optional().nullable(),
  // Undefined is reserved for legacy snapshots created before explicit
  // question-to-rubric mappings existed. Persistence hydrates those as "all
  // criteria" so historical published practices keep their original scoring
  // semantics.
  rubricCriterionIds: z.array(z.string().min(1)).optional(),
});

export const rubricCriterionSchema = z.object({
  id: z.string().min(1).optional(),
  order: z.number().int().nonnegative(),
  name: z.string().min(1),
  description: z.string().min(1),
  weight: z.number().positive(),
});

export const practiceDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  scenario: z.string().min(1),
  instructions: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  estimatedDurationMinutes: z.number().int().positive().optional().nullable(),
  questions: z.array(practiceQuestionSchema).min(1),
  rubricCriteria: z.array(rubricCriterionSchema).min(1),
});

export const practiceVersionSchema = z.object({
  id: z.string().min(1),
  practiceId: z.string().min(1),
  version: z.number().int().positive(),
  publishedAt: z.coerce.date(),
  snapshot: practiceDraftSchema,
});

export const practiceSchema = z.object({
  id: z.string().min(1),
  ownerOrganizationId: z.string().min(1),
  status: practiceStatusSchema,
  shareSlug: z.string().min(1).optional().nullable(),
  currentPublishedVersionId: z.string().min(1).optional().nullable(),
  draft: practiceDraftSchema,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type PracticeStatus = z.infer<typeof practiceStatusSchema>;
export type PracticeQuestion = z.infer<typeof practiceQuestionSchema>;
export type RubricCriterion = z.infer<typeof rubricCriterionSchema>;
export type PracticeDraft = z.infer<typeof practiceDraftSchema>;
export type PracticeVersion = z.infer<typeof practiceVersionSchema>;
export type Practice = z.infer<typeof practiceSchema>;

export interface PracticeRepository {
  getById(id: string): Promise<Practice | null>;
  getPublishedBySlug(slug: string): Promise<Practice | null>;
  listByOrganization(organizationId: string): Promise<Practice[]>;
  create(organizationId: string, draft: PracticeDraft): Promise<Practice>;
  updateDraft(id: string, draft: PracticeDraft): Promise<Practice>;
  publish(id: string): Promise<PracticeVersion>;
}
