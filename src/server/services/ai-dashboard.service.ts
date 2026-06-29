import { aiDashboardRepository } from "@/server/repositories";
import { requireAiAccess } from "@/server/services/ai-access";

const DAY_MS = 86_400_000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * AiDashboardService — assembles the orchestrator console: running workers,
 * queued jobs, success rate, average runtime, daily cost, top providers/
 * workers and the execution timeline. Everything is sourced here so the page
 * holds no query logic.
 */
export const aiDashboardService = {
  async getOverview(workspaceId: string) {
    await requireAiAccess(workspaceId, "view");

    const since = new Date(Date.now() - 7 * DAY_MS);
    const today = startOfToday();

    const [
      runningWorkers,
      queuedJobs,
      stateRows,
      success,
      avgRuntimeMs,
      dailyCost,
      workerCounts,
      workers,
      recentEvents,
    ] = await Promise.all([
      aiDashboardRepository.countRunningWorkers(workspaceId),
      aiDashboardRepository.countQueued(workspaceId),
      aiDashboardRepository.countByState(workspaceId),
      aiDashboardRepository.successStats(workspaceId, since),
      aiDashboardRepository.avgLatencyMs(workspaceId, since),
      aiDashboardRepository.costSince(workspaceId, today),
      aiDashboardRepository.executionCountsByWorker(workspaceId),
      aiDashboardRepository.workersForRollup(workspaceId),
      aiDashboardRepository.recentEvents(workspaceId, 15),
    ]);

    const totalDecided = success.completed + success.failed;
    const successRate =
      totalDecided > 0 ? (success.completed / totalDecided) * 100 : 0;

    // Roll worker execution counts up into top workers + top providers.
    const countByWorker = new Map(
      workerCounts.map((c) => [c.workerId, c._count._all]),
    );
    const topWorkers = workers
      .map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
        executions: countByWorker.get(w.id) ?? 0,
      }))
      .filter((w) => w.executions > 0)
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5);

    const providerAgg = new Map<
      string,
      { name: string; type: string; executions: number }
    >();
    for (const w of workers) {
      const count = countByWorker.get(w.id) ?? 0;
      if (count === 0) continue;
      const key = w.provider.id;
      const entry =
        providerAgg.get(key) ??
        { name: w.provider.name, type: w.provider.type, executions: 0 };
      entry.executions += count;
      providerAgg.set(key, entry);
    }
    const topProviders = [...providerAgg.values()]
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5);

    const states: Record<string, number> = {};
    for (const row of stateRows) states[row.state] = row._count._all;

    return {
      counts: { runningWorkers, queuedJobs },
      successRate,
      avgRuntimeMs,
      dailyCost,
      states,
      topWorkers,
      topProviders,
      recentEvents,
    };
  },
};

export type AiDashboardOverview = Awaited<
  ReturnType<typeof aiDashboardService.getOverview>
>;
