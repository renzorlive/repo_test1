import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — full Mission Workspace aggregate. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.get(workspaceId, missionId);
});

/** PATCH — update mission fields / lifecycle. */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.update(req, workspaceId, missionId);
});

/** DELETE — remove a mission (manage capability). */
export const DELETE = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.remove(workspaceId, missionId);
});
