import 'server-only';

import { z } from 'zod';

import { getPublishedPracticeVersionById } from '@/modules/practice/published-practice-version.repository';
import type { PracticeVersion } from '@/modules/practice/practice.schema';
import { DrizzleSessionRepository } from '@/modules/session/session.repository';
import type {
  Session,
  SessionRepository,
  SessionResponse,
  SubmitSessionResponseInput,
} from '@/modules/session/session.schema';

const publicParticipantSchema = z.object({
  name: z.string().trim().min(1).max(160).optional().nullable(),
  email: z.string().trim().email().max(320).optional().nullable(),
});

export type PublicParticipant = z.infer<typeof publicParticipantSchema>;

export type SessionContext = {
  session: Session;
  practiceVersion: PracticeVersion;
  responses: SessionResponse[];
};

function canParticipantAccess(
  session: Session,
  actorUserId: string | null,
): boolean {
  // Anonymous sessions intentionally remain URL-capability sessions. Once a
  // session is attached to a candidate account, that authenticated user owns
  // the read/write capability for the session and its report.
  return (
    session.participantUserId == null ||
    session.participantUserId === actorUserId
  );
}

export class SessionService {
  constructor(private readonly repository: SessionRepository) {}

  async createPublic(
    practiceVersionId: string,
    participantInput: PublicParticipant = {},
    participantUserId: string | null = null,
  ): Promise<Session> {
    const participant = publicParticipantSchema.parse(participantInput);

    // The repository independently verifies this is the stable practice's
    // current published version. Public links remain anonymous-capable, but a
    // logged-in candidate id can be attached so their history is durable.
    return this.repository.create({
      practiceVersionId,
      participantUserId,
      participantName: participant.name ?? null,
      participantEmail: participant.email ?? null,
    });
  }

  async getById(id: string): Promise<Session | null> {
    return this.repository.getById(id);
  }

  async getAccessibleById(
    id: string,
    actorUserId: string | null,
  ): Promise<Session | null> {
    const session = await this.repository.getById(id);
    if (!session || !canParticipantAccess(session, actorUserId)) {
      return null;
    }

    return session;
  }

  async getContext(id: string): Promise<SessionContext | null> {
    const session = await this.repository.getById(id);
    return session ? this.hydrateContext(session) : null;
  }

  async getAccessibleContext(
    id: string,
    actorUserId: string | null,
  ): Promise<SessionContext | null> {
    const session = await this.getAccessibleById(id, actorUserId);
    return session ? this.hydrateContext(session) : null;
  }

  private async hydrateContext(session: Session): Promise<SessionContext> {
    const practiceVersion = await getPublishedPracticeVersionById(
      session.practiceVersionId,
    );
    if (!practiceVersion) {
      throw new Error(
        `Published practice version ${session.practiceVersionId} was not found.`,
      );
    }

    const responses = await this.repository.listResponses(session.id);

    return { session, practiceVersion, responses };
  }

  private async requireParticipantAccess(
    id: string,
    actorUserId: string | null,
  ): Promise<Session> {
    const session = await this.getAccessibleById(id, actorUserId);
    if (!session) {
      // Keep missing and unauthorized sessions indistinguishable at the
      // application boundary so a session id cannot be used as an oracle.
      throw new Error('Session was not found or is not available.');
    }

    return session;
  }

  async start(id: string): Promise<Session> {
    return this.repository.start(id);
  }

  async startForParticipant(
    id: string,
    actorUserId: string | null,
  ): Promise<Session> {
    await this.requireParticipantAccess(id, actorUserId);
    return this.repository.start(id);
  }

  async saveResponse(input: SubmitSessionResponseInput): Promise<SessionResponse> {
    return this.repository.saveResponse(input);
  }

  async saveResponseForParticipant(
    input: SubmitSessionResponseInput,
    actorUserId: string | null,
  ): Promise<SessionResponse> {
    const session = await this.requireParticipantAccess(
      input.sessionId,
      actorUserId,
    );

    if (session.currentQuestionOrder !== input.questionOrder) {
      throw new Error('Responses must be submitted for the current question.');
    }

    return this.repository.saveResponse(input);
  }

  async setCurrentQuestion(id: string, questionOrder: number): Promise<Session> {
    return this.repository.setCurrentQuestion(id, questionOrder);
  }

  async setCurrentQuestionForParticipant(
    id: string,
    questionOrder: number,
    actorUserId: string | null,
  ): Promise<Session> {
    const session = await this.requireParticipantAccess(id, actorUserId);

    if (
      questionOrder !== session.currentQuestionOrder &&
      questionOrder !== session.currentQuestionOrder + 1
    ) {
      throw new Error('Session progress can only advance to the next question.');
    }

    return this.repository.setCurrentQuestion(id, questionOrder);
  }

  async complete(id: string): Promise<Session> {
    return this.repository.complete(id);
  }

  async completeForParticipant(
    id: string,
    actorUserId: string | null,
  ): Promise<Session> {
    await this.requireParticipantAccess(id, actorUserId);
    return this.repository.complete(id);
  }

  async abandon(id: string): Promise<Session> {
    return this.repository.abandon(id);
  }

  async abandonForParticipant(
    id: string,
    actorUserId: string | null,
  ): Promise<Session> {
    await this.requireParticipantAccess(id, actorUserId);
    return this.repository.abandon(id);
  }
}

export function createPublicSessionService(): SessionService {
  return new SessionService(new DrizzleSessionRepository());
}
