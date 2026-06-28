import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const missionMetricRepository = {
  listByMission(missionId: string) {
    return prisma.missionMetric.findMany({
      where: { missionId },
      orderBy: { recordedAt: "desc" },
      take: 200,
    });
  },

  create(data: Prisma.MissionMetricCreateInput) {
    return prisma.missionMetric.create({ data });
  },
};
