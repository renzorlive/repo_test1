import { aiQueueRepository } from "@/server/repositories";
import { requireAiAccess } from "@/server/services/ai-access";
import type { CreateQueueInput } from "@/validations";

export const aiQueueService = {
  async list(workspaceId: string) {
    await requireAiAccess(workspaceId, "view");
    return aiQueueRepository.listByWorkspace(workspaceId);
  },

  async create(workspaceId: string, input: CreateQueueInput) {
    await requireAiAccess(workspaceId, "manage");
    return aiQueueRepository.create(workspaceId, {
      name: input.name,
      description: input.description,
      priority: input.priority,
      concurrency: input.concurrency,
    });
  },
};
