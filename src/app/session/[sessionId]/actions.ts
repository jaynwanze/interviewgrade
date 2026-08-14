'use server';

import { redirect } from 'next/navigation';

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
