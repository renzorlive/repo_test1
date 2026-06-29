import { prisma } from "@/lib/prisma";

/**
 * Aggregate reads for the AI Orchestrator dashboard. Each is a single indexed
 * query (executions/costs/usages carry a denormalized workspaceId), so the
 * console stays cheap at thousands of executions per day.
 */
export const aiDashboardRepository = {
  countRunningWorkers(workspaceId: string) {
    return prisma.aiWorker.count({
      where: { workspaceId, status: { in: ["ACTIVE", "BUSY"] } },
    });
  },

  countQueued(workspaceId: string) {
    return prisma.aiExecution.count({
      where: { workspaceId, state: "QUEUED" },
    });
  },

  countByState(workspaceId: string) {
    return prisma.aiExecution.groupBy({
      by: ["state"],
      where: { workspaceId },
      _count: { _all: true },
    });
  },

  /** Completed vs failed since a cutoff, for success rate. */
  async successStats(workspaceId: string, since: Date) {
    const [completed, failed] = await prisma.$transaction([
      prisma.aiExecution.count({
        where: { workspaceId, state: "COMPLETED", createdAt: { gte: since } },
      }),
      prisma.aiExecution.count({
        where: { workspaceId, state: "FAILED", createdAt: { gte: since } },
      }),
    ]);
    return { completed, failed };
  },

  async avgLatencyMs(workspaceId: string, since: Date) {
    const agg = await prisma.aiUsage.aggregate({
      where: { workspaceId, createdAt: { gte: since } },
      _avg: { latencyMs: true },
    });
    return agg._avg.latencyMs ?? 0;
  },

  async costSince(workspaceId: string, since: Date) {
    const agg = await prisma.aiCost.aggregate({
      where: { workspaceId, createdAt: { gte: since } },
      _sum: { totalCost: true },
    });
    return agg._sum.totalCost ?? 0;
  },

  /** Execution counts per worker (top-workers + top-providers source). */
  executionCountsByWorker(workspaceId: string) {
    return prisma.aiExecution.groupBy({
      by: ["workerId"],
      where: { workspaceId, workerId: { not: null } },
      _count: { _all: true },
    });
  },

  workersForRollup(workspaceId: string) {
    return prisma.aiWorker.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        role: true,
        provider: { select: { id: true, name: true, type: true } },
      },
    });
  },

  recentEvents(workspaceId: string, take: number) {
    return prisma.aiExecutionEvent.findMany({
      where: { execution: { workspaceId } },
      orderBy: { createdAt: "desc" },
      take,
      include: { execution: { select: { id: true, title: true } } },
    });
  },
};
