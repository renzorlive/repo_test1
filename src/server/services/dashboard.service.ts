import {
  dashboardRepository,
  missionActivityRepository,
  missionApprovalRepository,
  aiSessionRepository,
} from "@/server/repositories";
import { requireMembership } from "@/server/services/access";

/**
 * DashboardService — assembles the workspace command-center view from many
 * small, indexed reads run in parallel. Every panel the dashboard renders is
 * sourced here so the page itself contains zero query logic.
 */
export const dashboardService = {
  async getOverview(workspaceId: string) {
    await requireMembership(workspaceId);

    const [
      activeMissionsCount,
      blockedMissionsCount,
      activeAiSessionsCount,
      pendingApprovalsCount,
      health,
      statuses,
      missions,
      upcomingDeadlines,
      recentActivity,
      approvalsWaiting,
      aiSessions,
    ] = await Promise.all([
      dashboardRepository.countActiveMissions(workspaceId),
      dashboardRepository.countBlockedMissions(workspaceId),
      dashboardRepository.countActiveAiSessions(workspaceId),
      dashboardRepository.countPendingApprovals(workspaceId),
      dashboardRepository.healthDistribution(workspaceId),
      dashboardRepository.statusDistribution(workspaceId),
      dashboardRepository.activeMissions(workspaceId, 6),
      dashboardRepository.upcomingDeadlines(workspaceId, 5),
      missionActivityRepository.listByWorkspace(workspaceId, 12),
      missionApprovalRepository.listPendingByWorkspace(workspaceId, 5),
      aiSessionRepository.listActiveByWorkspace(workspaceId, 5),
    ]);

    return {
      counts: {
        activeMissions: activeMissionsCount,
        blockedMissions: blockedMissionsCount,
        activeAiSessions: activeAiSessionsCount,
        pendingApprovals: pendingApprovalsCount,
      },
      health,
      statuses,
      missions,
      upcomingDeadlines,
      recentActivity,
      approvalsWaiting,
      aiSessions,
    };
  },
};

export type DashboardOverview = Awaited<
  ReturnType<typeof dashboardService.getOverview>
>;
