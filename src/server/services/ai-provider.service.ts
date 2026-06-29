import type { Prisma } from "@prisma/client";
import { aiProviderRepository } from "@/server/repositories";
import { requireAiAccess } from "@/server/services/ai-access";
import { NotFoundError } from "@/server/errors";
import type { CreateProviderInput, CreateModelInput } from "@/validations";

/** Providers + models registry management. */
export const aiProviderService = {
  async list(workspaceId: string) {
    await requireAiAccess(workspaceId, "view");
    return aiProviderRepository.listByWorkspace(workspaceId);
  },

  async create(workspaceId: string, input: CreateProviderInput) {
    await requireAiAccess(workspaceId, "manage");
    return aiProviderRepository.create(workspaceId, {
      name: input.name,
      type: input.type,
      baseUrl: input.baseUrl,
      enabled: input.enabled,
      config: input.config as Prisma.InputJsonValue,
    });
  },

  async createModel(workspaceId: string, input: CreateModelInput) {
    await requireAiAccess(workspaceId, "manage");
    const provider = await aiProviderRepository.findById(input.providerId);
    if (!provider || provider.workspaceId !== workspaceId) {
      throw new NotFoundError("Provider not found");
    }
    return aiProviderRepository.createModel({
      provider: { connect: { id: input.providerId } },
      name: input.name,
      label: input.label,
      contextWindow: input.contextWindow,
      maxOutputTokens: input.maxOutputTokens,
      inputCostPer1k: input.inputCostPer1k,
      outputCostPer1k: input.outputCostPer1k,
    });
  },
};
