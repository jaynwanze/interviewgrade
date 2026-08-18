'use server';

import { redirect } from 'next/navigation';

export async function generatePracticeReportAction(
  sessionId: string,
): Promise<void> {
  const normalizedId = sessionId.trim();
  if (!normalizedId) {
    redirect('/');
  }

  let generated = false;

  try {
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
