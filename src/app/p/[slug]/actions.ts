'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';

const participantFormSchema = z.object({
  name: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value : null),
    z.string().trim().min(1).max(160).nullable(),
  ),
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() ? value : null),
    z.string().trim().email().max(320).nullable(),
  ),
});

export async function startPublicPracticeSessionAction(
  slug: string,
  formData: FormData,
) {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    redirect('/');
  }

  const participant = participantFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
  });

  if (!participant.success) {
    redirect(`/p/${encodeURIComponent(normalizedSlug)}?error=details`);
  }

  const loggedInUser = await serverGetOptionalLoggedInUser();
  let publishedVersionId: string | null = null;

  try {
    const { getPublishedPracticeBySlug } = await import(
      '@/modules/practice/practice.service'
    );
    const practice = await getPublishedPracticeBySlug(normalizedSlug);
    publishedVersionId = practice?.currentPublishedVersionId ?? null;
  } catch (error) {
    console.error(
      'startPublicPracticeSessionAction: published practice unavailable',
      error,
    );
  }

  if (!publishedVersionId) {
    redirect(`/p/${encodeURIComponent(normalizedSlug)}?error=unavailable`);
  }

  let sessionId: string | null = null;

  try {
    const { createPublicSessionService } = await import(
      '@/modules/session/session.service'
    );
    const service = createPublicSessionService();
    const session = await service.createPublic(
      publishedVersionId,
      {
        name: participant.data.name,
        email: participant.data.email,
      },
      loggedInUser?.id ?? null,
    );
    sessionId = session.id;
  } catch (error) {
    console.error(
      'startPublicPracticeSessionAction: v2 session persistence unavailable',
      error,
    );
  }

  if (!sessionId) {
    redirect(`/p/${encodeURIComponent(normalizedSlug)}?error=unavailable`);
  }

  redirect(`/session/${sessionId}`);
}
