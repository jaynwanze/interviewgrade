import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { reserveV2PracticeGeneration } from '@/modules/billing/v2-practice-generation-usage';
import { getCoachGroundingContext } from '@/modules/coaching/coach.service';
import { buildFollowUpPracticeBrief } from '@/modules/coaching/follow-up-practice';
import { createAuthenticatedPracticeService } from '@/modules/practice/practice.service';
import { generatePracticeDraft } from '@/modules/practice/practice.generator';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

export const runtime = 'nodejs';
export const maxDuration = 60;

const requestSchema = z.object({
  sessionId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid follow-up Practice request.' }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid follow-up Practice request.' }, { status: 400 });
  }

  let user;
  try {
    user = await serverGetLoggedInUser();
  } catch {
    return NextResponse.json({ error: 'Sign in to create a follow-up Practice.' }, { status: 401 });
  }

  try {
    const grounding = await getCoachGroundingContext({
      sessionId: parsed.data.sessionId,
      userId: user.id,
    });

    if (grounding.status === 'forbidden' || grounding.status === 'not_found') {
      return NextResponse.json({ error: 'Practice result was not found.' }, { status: 404 });
    }
    if (grounding.status === 'not_complete') {
      return NextResponse.json(
        { error: 'Finish the Practice before creating a follow-up.' },
        { status: 409 },
      );
    }
    if (grounding.status === 'evaluation_missing') {
      return NextResponse.json(
        { error: 'Generate the final report before creating a follow-up.' },
        { status: 409 },
      );
    }
    if (grounding.status !== 'ready') {
      return NextResponse.json({ error: 'Practice result was not found.' }, { status: 404 });
    }

    const reservation = await reserveV2PracticeGeneration(user.id, 'brief');
    if (!reservation.allowed) {
      return NextResponse.json(
        {
          error: 'You have used this month’s AI-created Practice allowance.',
          code: 'ai-limit',
        },
        { status: 429 },
      );
    }

    const draft = await generatePracticeDraft({
      brief: buildFollowUpPracticeBrief(grounding.context),
      questionCount: 5,
    });

    const service = await createAuthenticatedPracticeService();
    const created = await service.create(draft);

    return NextResponse.json({ practiceId: created.id });
  } catch (error) {
    console.error(
      'Follow-up Practice generation failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'Follow-up Practice creation is temporarily unavailable.' },
      { status: 503 },
    );
  }
}
