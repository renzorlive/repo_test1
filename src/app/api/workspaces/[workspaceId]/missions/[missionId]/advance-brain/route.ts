import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** POST — let the Mission Brain take its next autonomous action(s). Body may
 * include `{ force: true }` to override the confidence gate. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.advanceBrain(req, workspaceId, missionId);
});
