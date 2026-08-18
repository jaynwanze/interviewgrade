import { z } from 'zod';

export const sessionStatusSchema = z.enum([
  'created',
  'in_progress',
  'completed',
  'abandoned',
]);

export const sessionResponseSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  questionOrder: z.number().int().nonnegative(),
  transcript: z.string(),
  audioStoragePath: z.string().optional().nullable(),
  durationSeconds: z.number().nonnegative().optional().nullable(),
  attemptNumber: z.number().int().positive(),
  submittedAt: z.coerce.date(),
});

export const sessionSchema = z.object({
  id: z.string().min(1),
  practiceVersionId: z.string().min(1),
  participantUserId: z.string().min(1).optional().nullable(),
  participantName: z.string().optional().nullable(),
  participantEmail: z.string().email().optional().nullable(),
  status: sessionStatusSchema,
  currentQuestionOrder: z.number().int().nonnegative(),
  startedAt: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type SessionStatus = z.infer<typeof sessionStatusSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
export type Session = z.infer<typeof sessionSchema>;

export interface CreateSessionInput {
  practiceVersionId: string;
  participantUserId?: string | null;
  participantName?: string | null;
  participantEmail?: string | null;
}

export interface SubmitSessionResponseInput {
  sessionId: string;
  questionId: string;
  questionOrder: number;
  transcript: string;
  audioStoragePath?: string | null;
  durationSeconds?: number | null;
}

export interface SessionRepository {
  getById(id: string): Promise<Session | null>;
  listResponses(sessionId: string): Promise<SessionResponse[]>;
  create(input: CreateSessionInput): Promise<Session>;
  start(id: string): Promise<Session>;
  saveResponse(input: SubmitSessionResponseInput): Promise<SessionResponse>;
  setCurrentQuestion(id: string, questionOrder: number): Promise<Session>;
  complete(id: string): Promise<Session>;
  abandon(id: string): Promise<Session>;
}
