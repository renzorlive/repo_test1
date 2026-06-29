import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET — AI Orchestrator dashboard overview. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.dashboard(workspaceId);
});
