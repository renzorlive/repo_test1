import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; executionId: string }> };

/** POST — approve an execution awaiting a human gate. */
export const POST = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return aiController.approveExecution(workspaceId, executionId);
});
