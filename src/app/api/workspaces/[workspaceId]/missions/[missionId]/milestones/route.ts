import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** POST — add a milestone to the mission timeline. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.addMilestone(req, workspaceId, missionId);
});
