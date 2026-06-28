import { missionController } from "@/server/controllers/mission.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; missionId: string }> };

/** GET — list notes for the mission. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.listNotes(workspaceId, missionId);
});

/** POST — add a note. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, missionId } = await params;
  return missionController.createNote(req, workspaceId, missionId);
});
