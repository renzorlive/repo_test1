import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{ workspaceId: string; aiExecutionId: string }>;
};

/** POST — send an AI execution to a host to run on its runtime (Claude Code). */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId, aiExecutionId } = await params;
  return runtimeController.dispatchAiExecution(req, workspaceId, aiExecutionId);
});
