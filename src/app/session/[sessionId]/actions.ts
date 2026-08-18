'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

const saveResponseSchema = z.object({
  questionId: z.string().min(1),
  questionOrder: z.number().int().nonnegative(),
  transcript: z.string().refine((value) => value.trim().length > 0, {
    message: 'Transcript cannot be blank.',
  }),
});

export async function beginPracticeSessionAction(sessionId: string) {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    redirect('/');
  }

  let started = false;

  try {
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const service = createPublicSessionService();
    await service.start(normalizedId);
    started = true;
  } catch (error) {
    console.error('beginPracticeSessionAction: could not start v2 session', error);
  }

  if (!started) {
    redirect(`/session/${encodeURIComponent(normalizedId)}?error=start`);
  }

  redirect(`/session/${encodeURIComponent(normalizedId)}?started=1`);
}

export async function savePracticeSessionResponseAction(
  sessionId: string,
  input: {
    questionId: string;
    questionOrder: number;
    transcript: string;
  },
): Promise<{ responseId: string }> {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    throw new Error('Session id is required.');
  }

  const parsed = saveResponseSchema.parse(input);
  const { createPublicSessionService } = await import(
    '@/modules/session/session.service'
  );
  const service = createPublicSessionService();
  const response = await service.saveResponse({
    sessionId: normalizedId,
    questionId: parsed.questionId,
    questionOrder: parsed.questionOrder,
    transcript: parsed.transcript,
  });

  return { responseId: response.id };
}

export async function advancePracticeSessionAction(
  sessionId: string,
  nextQuestionOrder: number,
): Promise<void> {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    throw new Error('Session id is required.');
  }

  const nextOrder = z.number().int().nonnegative().parse(nextQuestionOrder);
  const { createPublicSessionService } = await import(
    '@/modules/session/session.service'
  );
  const service = createPublicSessionService();
  await service.setCurrentQuestion(normalizedId, nextOrder);
}

export async function completePracticeSessionAction(
  sessionId: string,
): Promise<void> {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    throw new Error('Session id is required.');
  }

  const { createPublicSessionService } = await import(
    '@/modules/session/session.service'
  );
  const service = createPublicSessionService();
  await service.complete(normalizedId);

  try {
    const { createEvaluationService } = await import(
      '@/modules/evaluation/evaluation.service'
    );
    await createEvaluationService().getOrCreateReport(normalizedId);
  } catch (error) {
    // Completion is durable even when model evaluation is temporarily unavailable.
    // The report route exposes an explicit retry action for this case.
    console.error(
      'completePracticeSessionAction: report evaluation unavailable',
      error,
    );
  }

  redirect(`/session/${encodeURIComponent(normalizedId)}/report`);
}
