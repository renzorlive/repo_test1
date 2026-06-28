import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const missionDependencyRepository = {
  findEdge(missionId: string, dependsOnId: string) {
    return prisma.missionDependency.findUnique({
      where: { missionId_dependsOnId: { missionId, dependsOnId } },
    });
  },

  create(data: Prisma.MissionDependencyCreateInput) {
    return prisma.missionDependency.create({
      data,
      include: {
        dependsOn: { select: { id: true, title: true, status: true, health: true } },
      },
    });
  },
};
