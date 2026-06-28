import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** POST — add a dependency on another mission. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.createDependency(req, workspaceId, missionId);
});
