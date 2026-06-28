import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — list AI sessions for the mission. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.listAiSessions(workspaceId, missionId);
});

/** POST — start a new AI session. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.startAiSession(req, workspaceId, missionId);
});
