import 'server-only';

import {
  practiceDraftSchema,
  type Practice,
  type PracticeDraft,
  type PracticeRepository,
  type PracticeVersion,
} from '@/modules/practice/practice.schema';
import { DrizzlePracticeRepository } from '@/modules/practice/practice.repository';
import {
  isLegacyPracticeImportBridgeUnavailable,
  listLegacyImportedPracticeIds,
} from '@/modules/practice/legacy-practice-import.repository';
import { ensurePersonalWorkspace } from '@/modules/workspace/personal-workspace';
import { serverGetLoggedInUser } from '@/utils/server/serverGetLoggedInUser';

/**
 * Candidate-first v2 application service.
 *
 * Individual users never choose or manage an organization in the normal
 * practice flow. The authenticated factory resolves an invisible personal
 * workspace and scopes every creator-side operation to it.
 */
export class PracticeService {
  constructor(
    private readonly repository: PracticeRepository,
    private readonly workspaceId: string,
    private readonly actorUserId?: string,
  ) {}

  private assertOwnedByWorkspace(practice: Practice): void {
    if (practice.ownerOrganizationId !== this.workspaceId) {
      throw new Error('Practice does not belong to this workspace.');
    }
  }

  async listMine(): Promise<Practice[]> {
    const practices = await this.repository.listByOrganization(this.workspaceId);

    if (!this.actorUserId) {
      return practices;
    }

    // Built-in catalog templates are materialized into ordinary v2 Practice
    // containers for runtime/versioning, but they are not authored content and
    // should not pollute the candidate's "My Practices" library.
    //
    // Vercel does not apply SQL migrations during `next build`. If code reaches
    // production before the transitional bridge migration, keep the authored
    // library usable and simply skip this hiding layer until the table exists.
    try {
      const importedPracticeIds = await listLegacyImportedPracticeIds(
        this.actorUserId,
      );

      return practices.filter(
        (practice) => !importedPracticeIds.has(practice.id),
      );
    } catch (error) {
      if (isLegacyPracticeImportBridgeUnavailable(error)) {
        return practices;
      }
      throw error;
    }
  }

  async getById(id: string): Promise<Practice | null> {
    const practice = await this.repository.getById(id);
    if (!practice) {
      return null;
    }

    this.assertOwnedByWorkspace(practice);
    return practice;
  }

  async create(draftInput: PracticeDraft): Promise<Practice> {
    const draft = practiceDraftSchema.parse(draftInput);
    return this.repository.create(this.workspaceId, draft);
  }

  async updateDraft(id: string, draftInput: PracticeDraft): Promise<Practice> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error(`Practice ${id} was not found.`);
    }

    this.assertOwnedByWorkspace(existing);
    return this.repository.updateDraft(id, practiceDraftSchema.parse(draftInput));
  }

  async publish(id: string): Promise<PracticeVersion> {
    const existing = await this.repository.getById(id);
    if (!existing) {
      throw new Error(`Practice ${id} was not found.`);
    }

    this.assertOwnedByWorkspace(existing);
    return this.repository.publish(id);
  }
}

/**
 * Resolve the logged-in user, provision their hidden personal workspace on
 * first v2 use, then construct an actor-scoped Drizzle repository.
 */
export async function createAuthenticatedPracticeService(): Promise<PracticeService> {
  const user = await serverGetLoggedInUser();
  const workspaceId = await ensurePersonalWorkspace(user.id);
  const repository = new DrizzlePracticeRepository(user.id);

  return new PracticeService(repository, workspaceId, user.id);
}

/**
 * Public practice reads never expose the editable draft. The repository's slug
 * query hydrates only the immutable published version and requires no actor.
 */
export async function getPublishedPracticeBySlug(
  slug: string,
): Promise<Practice | null> {
  const normalizedSlug = slug.trim();
  if (!normalizedSlug) {
    return null;
  }

  return new DrizzlePracticeRepository().getPublishedBySlug(normalizedSlug);
}
