import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const include = {
  reviewer: { select: { id: true, name: true, image: true } },
  requestedBy: { select: { id: true, name: true, image: true } },
} satisfies Prisma.MissionApprovalInclude;

export const missionApprovalRepository = {
  findById(id: string) {
    return prisma.missionApproval.findUnique({ where: { id }, include });
  },

  listByMission(missionId: string) {
    return prisma.missionApproval.findMany({
      where: { missionId },
      orderBy: { createdAt: "desc" },
      include,
    });
  },

  /** Pending approvals across a workspace, for the dashboard "waiting" widget. */
  listPendingByWorkspace(workspaceId: string, take: number) {
    return prisma.missionApproval.findMany({
      where: { status: "PENDING", mission: { workspaceId } },
      orderBy: { createdAt: "asc" },
      take,
      include: {
        ...include,
        mission: { select: { id: true, title: true } },
      },
    });
  },

  create(data: Prisma.MissionApprovalCreateInput) {
    return prisma.missionApproval.create({ data, include });
  },

  update(id: string, data: Prisma.MissionApprovalUpdateInput) {
    return prisma.missionApproval.update({ where: { id }, data, include });
  },
};
