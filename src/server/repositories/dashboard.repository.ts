import { prisma } from "@/lib/prisma";
import type { MissionHealth, MissionStatus } from "@prisma/client";

const missionCardSelect = {
  id: true,
  title: true,
  status: true,
  health: true,
  priority: true,
  progress: true,
  dueDate: true,
  project: { select: { key: true, color: true } },
} as const;

/**
 * Read-optimized aggregate queries for the workspace dashboard. Each method is
 * a single indexed query against `missions.workspace_id` (denormalized), so the
 * dashboard stays cheap as the workspace grows to thousands of missions.
 */
export const dashboardRepository = {
  countActiveMissions(workspaceId: string) {
    return prisma.mission.count({
      where: { workspaceId, status: "ACTIVE" },
    });
  },

  countBlockedMissions(workspaceId: string) {
    return prisma.mission.count({
      where: { workspaceId, status: "BLOCKED" },
    });
  },

  async healthDistribution(
    workspaceId: string,
  ): Promise<Record<MissionHealth, number>> {
    const rows = await prisma.mission.groupBy({
      by: ["health"],
      where: { workspaceId, status: { in: ["ACTIVE", "BLOCKED"] } },
      _count: { _all: true },
    });
    const base: Record<MissionHealth, number> = {
      ON_TRACK: 0,
      AT_RISK: 0,
      OFF_TRACK: 0,
      BLOCKED: 0,
      UNKNOWN: 0,
    };
    for (const row of rows) base[row.health] = row._count._all;
    return base;
  },

  async statusDistribution(
    workspaceId: string,
  ): Promise<Record<MissionStatus, number>> {
    const rows = await prisma.mission.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: { _all: true },
    });
    const base: Record<MissionStatus, number> = {
      DRAFT: 0,
      ACTIVE: 0,
      BLOCKED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    for (const row of rows) base[row.status] = row._count._all;
    return base;
  },

  activeMissions(workspaceId: string, take: number) {
    return prisma.mission.findMany({
      where: { workspaceId, status: { in: ["ACTIVE", "BLOCKED"] } },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take,
      select: missionCardSelect,
    });
  },

  upcomingDeadlines(workspaceId: string, take: number) {
    return prisma.mission.findMany({
      where: {
        workspaceId,
        status: { in: ["ACTIVE", "BLOCKED", "DRAFT"] },
        dueDate: { gte: new Date() },
      },
      orderBy: { dueDate: "asc" },
      take,
      select: missionCardSelect,
    });
  },

  countActiveAiSessions(workspaceId: string) {
    return prisma.aiSession.count({
      where: {
        mission: { workspaceId },
        status: { in: ["QUEUED", "RUNNING"] },
      },
    });
  },

  countPendingApprovals(workspaceId: string) {
    return prisma.missionApproval.count({
      where: { status: "PENDING", mission: { workspaceId } },
    });
  },
};
