'use server';

import { z } from 'zod';

import { prepareBuiltInPracticeVersion } from '@/modules/practice/built-in-practice-import.service';
import { isLegacyPracticeImportBridgeUnavailable } from '@/modules/practice/legacy-practice-import.repository';
import { loadLegacyBuiltInPracticeSource } from '@/modules/practice/legacy-practice-source';
import { startLegacySessionAction } from '@/modules/session/legacy-session.actions';
import { createPublicSessionService } from '@/modules/session/session.service';
import { canStartV2AwarePracticeSession } from '@/modules/session/session-usage.service';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

const templateIdSchema = z.string().trim().min(1).max(160);

type BuiltInPracticeStartResult = {
  sessionId: string;
  runtime: 'v2' | 'legacy';
};

export async function startBuiltInPracticeSessionAction(
  legacyTemplateIdInput: string,
): Promise<BuiltInPracticeStartResult> {
  const legacyTemplateId = templateIdSchema.parse(legacyTemplateIdInput);
  const access = await canStartV2AwarePracticeSession();

  if (!access.allowed) {
    throw new Error('Practice session limit reached.');
  }

  const user = await serverGetLoggedInUser();

  try {
    const publishedVersion = await prepareBuiltInPracticeVersion(
      user.id,
      legacyTemplateId,
    );
    const session = await createPublicSessionService().createPublic(
      publishedVersion.id,
      {},
      user.id,
    );

    return { sessionId: session.id, runtime: 'v2' };
  } catch (error) {
    // Vercel only runs `next build`; it does not apply SQL migrations. During
    // the short deploy-order window before legacy_practice_imports exists in
    // production, preserve the proven legacy Practice start path instead of
    // turning a migration ordering issue into a user-facing outage.
    if (!isLegacyPracticeImportBridgeUnavailable(error)) {
      throw error;
    }

    console.warn(
      'startBuiltInPracticeSessionAction: v2 import bridge is not migrated yet; falling back to legacy Practice runtime.',
    );
    const source = await loadLegacyBuiltInPracticeSource(legacyTemplateId);
    const legacySession = await startLegacySessionAction(source.template, 'practice');

    return { sessionId: legacySession.id, runtime: 'legacy' };
  }
}
