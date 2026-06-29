import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** PATCH — switch a mission between Founder and Advanced mode. */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.setMode(req, workspaceId, missionId);
});
