import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const include = {
  agent: { select: { id: true, name: true, type: true } },
} satisfies Prisma.AiSessionInclude;

export const aiSessionRepository = {
  findById(id: string) {
    return prisma.aiSession.findUnique({ where: { id }, include });
  },

  listByMission(missionId: string) {
    return prisma.aiSession.findMany({
      where: { missionId },
      orderBy: { createdAt: "desc" },
      include,
    });
  },

  /** Active sessions across a workspace, for the dashboard. */
  listActiveByWorkspace(workspaceId: string, take: number) {
    return prisma.aiSession.findMany({
      where: {
        status: { in: ["QUEUED", "RUNNING"] },
        mission: { workspaceId },
      },
      orderBy: { createdAt: "desc" },
      take,
      include: { ...include, mission: { select: { id: true, title: true } } },
    });
  },

  create(data: Prisma.AiSessionCreateInput) {
    return prisma.aiSession.create({ data, include });
  },

  update(id: string, data: Prisma.AiSessionUpdateInput) {
    return prisma.aiSession.update({ where: { id }, data, include });
  },
};
