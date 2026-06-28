import { missionRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { missionPolicy } from "@/server/policies/mission.policy";
import type { MissionCapability } from "@/server/policies/mission.policy";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import type { ActivityActor } from "@/server/events/mission-events";

/**
 * Resolve a mission the current user is allowed to act on.
 *
 * One guard, used by every mission-scoped service, that combines:
 *  - workspace membership (tenancy),
 *  - mission existence + workspace ownership (no cross-tenant id guessing),
 *  - capability check via MissionPolicies.
 *
 * Returns the user, their membership, the mission, and a ready-to-use activity
 * actor so callers don't re-derive it.
 */
export async function requireMissionAccess(
  workspaceId: string,
  missionId: string,
  capability: MissionCapability = "view",
) {
  const { user, membership } = await requireMembership(workspaceId);

  const mission = await missionRepository.findCore(missionId);
  if (!mission || mission.workspaceId !== workspaceId) {
    throw new NotFoundError("Mission not found");
  }

  if (!missionPolicy.can(membership.role, capability)) {
    throw new ForbiddenError(
      `Your role (${membership.role}) cannot ${capability} this mission`,
    );
  }

  const actor: ActivityActor = {
    type: "USER",
    id: user.id,
    name: user.name ?? user.email ?? "Member",
  };

  return { user, membership, mission, actor };
}
