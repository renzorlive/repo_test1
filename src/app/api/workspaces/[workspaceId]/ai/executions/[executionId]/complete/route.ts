import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; executionId: string }> };

/** POST — worker callback: report a successful result. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return aiController.completeExecution(req, workspaceId, executionId);
});
