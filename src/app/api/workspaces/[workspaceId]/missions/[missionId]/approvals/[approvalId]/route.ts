import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{
    workspaceId: string;
    missionId: string;
    approvalId: string;
  }>;
};

/** PATCH — record a reviewer decision on an approval. */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId, approvalId } = await params;
  return missionController.decideApproval(
    req,
    workspaceId,
    missionId,
    approvalId,
  );
});
