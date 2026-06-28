import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — list approval gates for the mission. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.listApprovals(workspaceId, missionId);
});

/** POST — request a new approval. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.requestApproval(req, workspaceId, missionId);
});
