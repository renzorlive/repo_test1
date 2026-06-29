import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{ workspaceId: string; missionId: string; stageId: string }>;
};

/** POST — reject the gate (review → fixes; deploy → pause). */
export const POST = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId, stageId } = await params;
  return missionController.rejectStage(workspaceId, missionId, stageId);
});
