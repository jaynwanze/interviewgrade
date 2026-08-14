import { z } from "zod";

export const criterionScoreSchema = z.object({
  criterionId: z.string().min(1),
  criterionName: z.string().min(1),
  score: z.number().min(0).max(100),
  feedback: z.string().min(1),
});

export const evaluationModelMetadataSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  promptVersion: z.string().min(1),
});

export const responseEvaluationSchema = z.object({
  id: z.string().min(1),
  sessionResponseId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  criterionScores: z.array(criterionScoreSchema),
  strengths: z.array(z.string().min(1)),
  improvements: z.array(z.string().min(1)),
  recommendation: z.string().min(1),
  schemaVersion: z.string().min(1),
  modelMetadata: evaluationModelMetadataSchema,
  createdAt: z.coerce.date(),
});

export const sessionEvaluationSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  overallScore: z.number().min(0).max(100),
  criterionScores: z.array(criterionScoreSchema),
  strengths: z.array(z.string().min(1)),
  improvements: z.array(z.string().min(1)),
  recommendation: z.string().min(1),
  schemaVersion: z.string().min(1),
  modelMetadata: evaluationModelMetadataSchema,
  createdAt: z.coerce.date(),
});

export type CriterionScore = z.infer<typeof criterionScoreSchema>;
export type EvaluationModelMetadata = z.infer<
  typeof evaluationModelMetadataSchema
>;
export type ResponseEvaluation = z.infer<typeof responseEvaluationSchema>;
export type SessionEvaluation = z.infer<typeof sessionEvaluationSchema>;

export interface EvaluationRepository {
  getResponseEvaluation(responseId: string): Promise<ResponseEvaluation | null>;
  getSessionEvaluation(sessionId: string): Promise<SessionEvaluation | null>;
  saveResponseEvaluation(
    evaluation: ResponseEvaluation,
  ): Promise<ResponseEvaluation>;
  saveSessionEvaluation(
    evaluation: SessionEvaluation,
  ): Promise<SessionEvaluation>;
}
