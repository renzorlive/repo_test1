import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET — list executions (optionally filtered by ?state=). */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.listExecutions(req, workspaceId);
});

/** POST — submit a new execution to the orchestrator. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.submitExecution(req, workspaceId);
});
