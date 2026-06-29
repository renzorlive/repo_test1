import {
  runtimeHostRepository,
  runtimeExecutionRepository,
} from "@/server/repositories";
import { requireRuntimeAccess } from "@/server/services/runtime-access";
import type { RuntimeExecutionStatus } from "@/types";

/**
 * Host Dashboard data: connected machines, current jobs, queue depth, worker
 * counts and fleet health — the "control room" for the distributed runtime.
 */
export const runtimeDashboardService = {
  async getOverview(workspaceId: string) {
    await requireRuntimeAccess(workspaceId, "view");

    const [hosts, statusRows, runningJobs] = await Promise.all([
      runtimeHostRepository.listByWorkspace(workspaceId),
      runtimeExecutionRepository.countByStatus(workspaceId),
      runtimeExecutionRepository.listByWorkspace(workspaceId, {
        status: { equals: "RUNNING" },
        take: 10,
      }),
    ]);

    const states = {} as Record<RuntimeExecutionStatus, number>;
    for (const row of statusRows) states[row.status] = row._count._all;

    const onlineHosts = hosts.filter((h) => h.status === "ONLINE").length;
    const runtimeCount = hosts.reduce((sum, h) => sum + h.runtimes.length, 0);
    const queued = (states.PENDING ?? 0) + (states.DISPATCHED ?? 0);

    return {
      hosts,
      runningJobs,
      states,
      totals: {
        hosts: hosts.length,
        onlineHosts,
        runtimes: runtimeCount,
        queued,
        running: states.RUNNING ?? 0,
      },
    };
  },
};

export type RuntimeDashboardData = Awaited<
  ReturnType<typeof runtimeDashboardService.getOverview>
>;
