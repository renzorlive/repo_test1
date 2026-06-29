import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const aiQueueRepository = {
  listByWorkspace(workspaceId: string) {
    return prisma.aiQueue.findMany({
      where: { workspaceId },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      include: { _count: { select: { executions: true } } },
    });
  },

  findById(id: string) {
    return prisma.aiQueue.findUnique({ where: { id } });
  },

  create(workspaceId: string, data: Prisma.AiQueueCreateWithoutWorkspaceInput) {
    return prisma.aiQueue.create({
      data: { ...data, workspace: { connect: { id: workspaceId } } },
    });
  },
};
