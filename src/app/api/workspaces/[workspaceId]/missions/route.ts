import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspaces/:workspaceId/missions */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return missionController.list(req, workspaceId);
});

/** POST /api/workspaces/:workspaceId/missions */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return missionController.create(req, workspaceId);
});
