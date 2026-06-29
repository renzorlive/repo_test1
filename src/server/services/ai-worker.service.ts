import {
  aiWorkerRepository,
  aiProviderRepository,
} from "@/server/repositories";
import { requireAiAccess } from "@/server/services/ai-access";
import { NotFoundError, ValidationError } from "@/server/errors";
import type { CreateWorkerInput, UpdateWorkerInput } from "@/validations";

/** Worker Registry management. */
export const aiWorkerService = {
  async list(workspaceId: string) {
    await requireAiAccess(workspaceId, "view");
    return aiWorkerRepository.listByWorkspace(workspaceId);
  },

  async getById(workspaceId: string, id: string) {
    await requireAiAccess(workspaceId, "view");
    const worker = await aiWorkerRepository.findById(id);
    if (!worker || worker.workspaceId !== workspaceId) {
      throw new NotFoundError("Worker not found");
    }
    return worker;
  },

  async create(workspaceId: string, input: CreateWorkerInput) {
    await requireAiAccess(workspaceId, "manage");

    // The model must belong to the chosen provider, and the provider to the
    // workspace — no cross-tenant or mismatched bindings.
    const model = await aiProviderRepository.findModelById(input.modelId);
    if (
      !model ||
      model.providerId !== input.providerId ||
      model.provider.workspaceId !== workspaceId
    ) {
      throw new ValidationError("Model does not belong to the selected provider");
    }

    return aiWorkerRepository.create(
      workspaceId,
      {
        name: input.name,
        role: input.role,
        description: input.description,
        status: input.status,
        contextWindow: input.contextWindow,
        maxTokens: input.maxTokens,
        inputCostPer1k: input.inputCostPer1k,
        outputCostPer1k: input.outputCostPer1k,
        priority: input.priority,
        concurrency: input.concurrency,
        temperature: input.temperature,
        timeoutMs: input.timeoutMs,
        maxRetries: input.maxRetries,
        version: input.version,
      },
      input.providerId,
      input.modelId,
      input.capabilities,
    );
  },

  async update(workspaceId: string, id: string, input: UpdateWorkerInput) {
    await this.getById(workspaceId, id);
    const { heartbeat, ...rest } = input;
    return aiWorkerRepository.update(id, {
      ...rest,
      ...(heartbeat ? { lastSeenAt: new Date() } : {}),
    });
  },
};
