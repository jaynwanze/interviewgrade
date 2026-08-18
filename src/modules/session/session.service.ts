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

  async getContext(id: string): Promise<SessionContext | null> {
    const session = await this.repository.getById(id);
    if (!session) {
      return null;
    }

    const practiceVersion = await getPublishedPracticeVersionById(
      session.practiceVersionId,
    );
    if (!practiceVersion) {
      throw new Error(
        `Published practice version ${session.practiceVersionId} was not found.`,
      );
    }

    const responses = await this.repository.listResponses(id);

    return { session, practiceVersion, responses };
  }

  async start(id: string): Promise<Session> {
    return this.repository.start(id);
  }

  async saveResponse(input: SubmitSessionResponseInput): Promise<SessionResponse> {
    return this.repository.saveResponse(input);
  }

  async setCurrentQuestion(id: string, questionOrder: number): Promise<Session> {
    return this.repository.setCurrentQuestion(id, questionOrder);
  }

  async complete(id: string): Promise<Session> {
    return this.repository.complete(id);
  }

  async abandon(id: string): Promise<Session> {
    return this.repository.abandon(id);
  }
}

export function createPublicSessionService(): SessionService {
  return new SessionService(new DrizzleSessionRepository());
}
