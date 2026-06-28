import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — list recorded metrics for the mission. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.listMetrics(workspaceId, missionId);
});

/** POST — record a metric sample. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.recordMetric(req, workspaceId, missionId);
});
