import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; executionId: string }> };

/** POST — reject an execution awaiting a human gate. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return aiController.rejectExecution(req, workspaceId, executionId);
});
