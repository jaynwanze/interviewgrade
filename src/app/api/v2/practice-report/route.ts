import { serverGetOptionalLoggedInUser } from '@/utils/server/serverGetOptionalLoggedInUser';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const reportRequestSchema = z.object({
  sessionId: z.string().min(1).max(160),
});

async function getAccessibleCompletedSession(sessionId: string) {
  const loggedInUser = await serverGetOptionalLoggedInUser();
  const { createPublicSessionService } = await import(
    '@/modules/session/session.service'
  );
  const session = await createPublicSessionService().getAccessibleById(
    sessionId,
    loggedInUser?.id ?? null,
  );

  if (!session) return { error: 'not-found' as const };
  if (session.status !== 'completed') return { error: 'not-complete' as const };
  return { session };
}

export async function GET(request: NextRequest) {
  const parsed = reportRequestSchema.safeParse({
    sessionId: request.nextUrl.searchParams.get('sessionId'),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid report request.' }, { status: 400 });
  }

  const access = await getAccessibleCompletedSession(parsed.data.sessionId);
  if ('error' in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.error === 'not-found' ? 404 : 409 },
    );
  }

  try {
    const { createEvaluationService } = await import(
      '@/modules/evaluation/evaluation.service'
    );
    const report = await createEvaluationService().getExistingReport(
      parsed.data.sessionId,
    );
    return NextResponse.json({ status: report ? 'ready' : 'pending' });
  } catch (error) {
    console.error('practice report status unavailable', error);
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid report request.' }, { status: 400 });
  }

  const parsed = reportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid report request.' }, { status: 400 });
  }

  const access = await getAccessibleCompletedSession(parsed.data.sessionId);
  if ('error' in access) {
    return NextResponse.json(
      { error: access.error },
      { status: access.error === 'not-found' ? 404 : 409 },
    );
  }

  try {
    const { createEvaluationService } = await import(
      '@/modules/evaluation/evaluation.service'
    );
    await createEvaluationService().getOrCreateReport(parsed.data.sessionId);
    return NextResponse.json({ status: 'ready' });
  } catch (error) {
    console.error('practice report generation unavailable', error);
    return NextResponse.json({ status: 'unavailable' }, { status: 503 });
  }
}
