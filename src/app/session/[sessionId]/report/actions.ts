'use server';

import { redirect } from 'next/navigation';

import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

export async function generatePracticeReportAction(
  sessionId: string,
): Promise<void> {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    redirect('/');
  }

  let generated = false;

  try {
    const loggedInUser = await serverGetOptionalLoggedInUser();
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const session = await createPublicSessionService().getAccessibleById(
      normalizedId,
      loggedInUser?.id ?? null,
    );

    if (!session || session.status !== 'completed') {
      throw new Error('Session was not found or is not ready for evaluation.');
    }

    const { createEvaluationService } = await import(
      '@/modules/evaluation/evaluation.service'
    );
    await createEvaluationService().getOrCreateReport(normalizedId);
    generated = true;
  } catch (error) {
    console.error('generatePracticeReportAction: evaluation unavailable', error);
  }

  const reportPath = `/session/${encodeURIComponent(normalizedId)}/report`;
  redirect(generated ? reportPath : `${reportPath}?error=evaluation`);
}
