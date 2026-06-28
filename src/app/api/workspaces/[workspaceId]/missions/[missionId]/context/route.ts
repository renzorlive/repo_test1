import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** PATCH — upsert the mission working context. */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.updateContext(req, workspaceId, missionId);
});
