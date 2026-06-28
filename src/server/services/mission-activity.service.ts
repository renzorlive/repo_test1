import { missionActivityRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { requireMissionAccess } from "@/server/services/mission-access";
import type { ActivityQuery } from "@/validations";

/**
 * MissionActivity (read side). Writes happen exclusively through MissionEvents;
 * this service serves the mission timeline and the workspace activity feed.
 */
export const missionActivityService = {
  async listForMission(
    workspaceId: string,
    missionId: string,
    query: ActivityQuery,
  ) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return missionActivityRepository.listByMission(missionId, {
      take: query.limit,
      cursor: query.cursor,
    });
  },

  async workspaceFeed(workspaceId: string, take = 20) {
    await requireMembership(workspaceId);
    return missionActivityRepository.listByWorkspace(workspaceId, take);
  },
};
