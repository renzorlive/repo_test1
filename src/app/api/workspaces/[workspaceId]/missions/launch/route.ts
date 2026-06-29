import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** POST — launch an autonomous mission from a single business objective. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return missionController.launchMission(req, workspaceId);
});
