import {
  dashboardRepository,
  aiDashboardRepository,
  missionApprovalRepository,
  missionActivityRepository,
} from "@/server/repositories";
import { requireMembership } from "@/server/services/access";

const DAY_MS = 86_400_000;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * MissionControlService — the homepage ("Mission Control") aggregate. One
 * authorized call assembles everything a founder needs at a glance: active
 * missions to resume, running executions, approvals, today's progress and the
 * week's goals.
 */
export const missionControlService = {
  async get(workspaceId: string) {
    await requireMembership(workspaceId);
    const today = startOfToday();
    const weekEnd = new Date(Date.now() + 7 * DAY_MS);

    const [
      missions,
      runningExecutions,
      approvals,
      upcoming,
      activitiesToday,
      executionsCompletedToday,
      costToday,
    ] = await Promise.all([
      dashboardRepository.activeMissions(workspaceId, 6),
      aiDashboardRepository.runningExecutions(workspaceId, 5),
      missionApprovalRepository.listPendingByWorkspace(workspaceId, 5),
      dashboardRepository.upcomingDeadlines(workspaceId, 8),
      missionActivityRepository.countSince(workspaceId, today),
      aiDashboardRepository.countCompletedSince(workspaceId, today),
      aiDashboardRepository.costSince(workspaceId, today),
    ]);

    const weeklyGoals = upcoming.filter(
      (m) => m.dueDate !== null && new Date(m.dueDate) <= weekEnd,
    );

    return {
      missions,
      runningExecutions,
      approvals,
      weeklyGoals,
      todayProgress: {
        activities: activitiesToday,
        executionsCompleted: executionsCompletedToday,
        cost: costToday,
      },
    };
  },
};

export type MissionControlData = Awaited<
  ReturnType<typeof missionControlService.get>
>;
