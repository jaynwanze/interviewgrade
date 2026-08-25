import { NextRequest, NextResponse } from 'next/server';

import { generateCoachAnswer } from '@/modules/coaching/coach.generator';
import { coachRequestSchema } from '@/modules/coaching/coach.schema';
import { getCoachGroundingContext } from '@/modules/coaching/coach.service';
import { reserveCoachRequest } from '@/modules/coaching/coach.usage';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('sessionId')?.trim();
  if (!sessionId) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  let user;
  try {
    user = await serverGetLoggedInUser();
  } catch {
    return NextResponse.json({ available: false }, { status: 401 });
  }

  try {
    const grounding = await getCoachGroundingContext({
      sessionId,
      userId: user.id,
    });
    return NextResponse.json({ available: grounding.status === 'ready' });
  } catch (error) {
    console.error(
      'Practice Coach availability check failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ available: false }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid Coach request.' }, { status: 400 });
  }

  const parsed = coachRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Coach request.' }, { status: 400 });
  }

  let user;
  try {
    user = await serverGetLoggedInUser();
  } catch {
    return NextResponse.json({ error: 'Sign in to use AI Coach.' }, { status: 401 });
  }

  try {
    const grounding = await getCoachGroundingContext({
      sessionId: parsed.data.sessionId,
      responseId: parsed.data.responseId,
      userId: user.id,
    });

    if (grounding.status === 'forbidden' || grounding.status === 'not_found') {
      return NextResponse.json({ error: 'Coach context was not found.' }, { status: 404 });
    }
    if (grounding.status === 'not_complete') {
      return NextResponse.json(
        { error: 'Finish the Practice before using AI Coach.' },
        { status: 409 },
      );
    }
    if (grounding.status === 'evaluation_missing') {
      return NextResponse.json(
        { error: 'Generate the final report before using AI Coach.' },
        { status: 409 },
      );
    }

    const reservation = await reserveCoachRequest(user.id, parsed.data.sessionId);
    if (!reservation.allowed) {
      return NextResponse.json(
        {
          error:
            reservation.retryAfterSeconds > 0
              ? 'AI Coach is being used too quickly. Try again in a few minutes.'
              : 'You have used the available Coach questions for this Practice result.',
          remaining: reservation.remaining,
        },
        {
          status: 429,
          headers:
            reservation.retryAfterSeconds > 0
              ? { 'Retry-After': String(reservation.retryAfterSeconds) }
              : undefined,
        },
      );
    }

    const answer = await generateCoachAnswer({
      question: parsed.data.question,
      grounding: grounding.context,
    });

    return NextResponse.json({
      ...answer,
      remaining: reservation.remaining,
    });
  } catch (error) {
    console.error(
      'Practice Coach request failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'AI Coach is temporarily unavailable. Your report is unchanged.' },
      { status: 503 },
    );
  }
}
