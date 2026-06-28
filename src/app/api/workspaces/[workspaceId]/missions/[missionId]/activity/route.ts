import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — paginated mission activity timeline. */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.listActivity(req, workspaceId, missionId);
});
