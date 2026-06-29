import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** POST — preview the assembled context + prompt (no execution is created). */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.previewExecution(req, workspaceId, missionId);
});
