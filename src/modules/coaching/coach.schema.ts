import { z } from 'zod';

export const coachRequestSchema = z.object({
  sessionId: z.string().uuid(),
  responseId: z.string().uuid().optional(),
  question: z.string().trim().min(3).max(500),
});

export const coachAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(5000),
});

export type CoachRequest = z.infer<typeof coachRequestSchema>;
export type CoachAnswer = z.infer<typeof coachAnswerSchema>;
