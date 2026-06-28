import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{
    workspaceId: string;
    missionId: string;
    sessionId: string;
  }>;
};

/** PATCH — update an AI session (status, tokens, cost). */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId, sessionId } = await params;
  return missionController.updateAiSession(
    req,
    workspaceId,
    missionId,
    sessionId,
  );
});
