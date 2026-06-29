import { prisma } from "@/lib/prisma";
import type { MissionStageType, Prisma } from "@prisma/client";

const planInclude = {
  stages: { orderBy: { position: "asc" } },
} satisfies Prisma.MissionPlanInclude;

export type MissionPlanWithStages = Prisma.MissionPlanGetPayload<{
  include: typeof planInclude;
}>;

/**
 * The Mission Brain's plan + stages. Data access only — the brain logic lives
 * in `missionBrainService`.
 */
export const missionPlanRepository = {
  findByMission(missionId: string) {
    return prisma.missionPlan.findUnique({
      where: { missionId },
      include: planInclude,
    });
  },

  createWithStages(
    missionId: string,
    objective: string,
    stages: {
      type: MissionStageType;
      title: string;
      description?: string;
      requiresApproval: boolean;
    }[],
  ) {
    return prisma.missionPlan.create({
      data: {
        mission: { connect: { id: missionId } },
        objective,
        status: "ACTIVE",
        currentStage: stages[0]?.type,
        stages: {
          create: stages.map((s, i) => ({
            missionId,
            type: s.type,
            title: s.title,
            description: s.description,
            requiresApproval: s.requiresApproval,
            position: i,
          })),
        },
      },
      include: planInclude,
    });
  },

  updatePlan(id: string, data: Prisma.MissionPlanUpdateInput) {
    return prisma.missionPlan.update({ where: { id }, data });
  },

  findStage(id: string) {
    return prisma.missionStage.findUnique({ where: { id } });
  },

  updateStage(id: string, data: Prisma.MissionStageUpdateInput) {
    return prisma.missionStage.update({ where: { id }, data });
  },

  /** Find a stage of a given type within a plan (e.g. to skip FIX). */
  findStageOfType(planId: string, type: MissionStageType) {
    return prisma.missionStage.findFirst({ where: { planId, type } });
  },
};
