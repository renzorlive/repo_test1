import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{ workspaceId: string; executionId: string }>;
};

/** GET — full execution aggregate (timeline, prompt, result, cost, logs). */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return aiController.getExecution(workspaceId, executionId);
});
