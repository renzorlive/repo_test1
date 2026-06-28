import { workspaceRepository } from "@/server/repositories";
import { requireUser, requireMembership } from "@/server/services/access";
import { slugify } from "@/lib/utils";
import type { CreateWorkspaceInput, UpdateWorkspaceInput } from "@/validations";

/** Workspace service — tenancy lifecycle + membership-aware reads. */
export const workspaceService = {
  async listForCurrentUser() {
    const user = await requireUser();
    return workspaceRepository.findManyForUser(user.id);
  },

  async create(input: CreateWorkspaceInput) {
    const user = await requireUser();
    const slug = await this.uniqueSlug(input.slug ?? slugify(input.name));
    return workspaceRepository.createWithOwner(user.id, {
      name: input.name,
      slug,
      imageUrl: input.imageUrl,
    });
  },

  async update(workspaceId: string, input: UpdateWorkspaceInput) {
    await requireMembership(workspaceId);
    return workspaceRepository.update(workspaceId, input);
  },

  /** Ensure slug uniqueness by appending a numeric suffix when needed. */
  async uniqueSlug(base: string) {
    let candidate = base;
    let suffix = 1;
    while (await workspaceRepository.findBySlug(candidate)) {
      candidate = `${base}-${suffix++}`;
    }
    return candidate;
  },
};
