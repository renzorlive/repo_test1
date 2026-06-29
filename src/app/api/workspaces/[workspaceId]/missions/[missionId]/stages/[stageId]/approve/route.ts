import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{ workspaceId: string; missionId: string; stageId: string }>;
};

/** POST — approve the pipeline stage the brain paused on. */
export const POST = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId, stageId } = await params;
  return missionController.approveStage(workspaceId, missionId, stageId);
});
