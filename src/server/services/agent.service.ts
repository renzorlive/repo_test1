import type { Prisma } from "@prisma/client";
import { agentRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { NotFoundError } from "@/server/errors";
import type { Paginated } from "@/types";
import type { CreateAgentInput, UpdateAgentInput } from "@/validations";
import type { ListQuery } from "@/validations/common";

/**
 * Agent service. NOTE: this manages agent *definitions* only — no live AI
 * execution is wired up yet (config is stored as opaque JSON).
 */
export const agentService = {
  async list(
    workspaceId: string,
    query: ListQuery,
  ): Promise<Paginated<Awaited<ReturnType<typeof agentRepository.findById>>>> {
    await requireMembership(workspaceId);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await agentRepository.findManyByWorkspace(
      workspaceId,
      { skip, take: query.pageSize, search: query.search },
    );
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.ceil(total / query.pageSize),
    };
  },

  async getById(workspaceId: string, id: string) {
    await requireMembership(workspaceId);
    const agent = await agentRepository.findById(id);
    if (!agent || agent.workspaceId !== workspaceId) {
      throw new NotFoundError("Agent not found");
    }
    return agent;
  },

  async create(workspaceId: string, input: CreateAgentInput) {
    await requireMembership(workspaceId);
    return agentRepository.create(workspaceId, {
      ...input,
      config: input.config as Prisma.InputJsonValue,
    });
  },

  async update(workspaceId: string, id: string, input: UpdateAgentInput) {
    await this.getById(workspaceId, id);
    return agentRepository.update(id, {
      ...input,
      config: input.config as Prisma.InputJsonValue | undefined,
    });
  },

  async remove(workspaceId: string, id: string) {
    await this.getById(workspaceId, id);
    return agentRepository.remove(id);
  },
};
