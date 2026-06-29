import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Providers + their models. Data access only. */
export const aiProviderRepository = {
  listByWorkspace(workspaceId: string) {
    return prisma.aiProvider.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: {
        models: { orderBy: { name: "asc" } },
        _count: { select: { workers: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.aiProvider.findUnique({ where: { id }, include: { models: true } });
  },

  create(workspaceId: string, data: Prisma.AiProviderCreateWithoutWorkspaceInput) {
    return prisma.aiProvider.create({
      data: { ...data, workspace: { connect: { id: workspaceId } } },
    });
  },

  findModelById(id: string) {
    return prisma.aiModel.findUnique({ where: { id }, include: { provider: true } });
  },

  createModel(data: Prisma.AiModelCreateInput) {
    return prisma.aiModel.create({ data });
  },
};
