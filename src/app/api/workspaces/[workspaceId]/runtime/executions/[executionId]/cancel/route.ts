import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; executionId: string }> };

export const POST = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return runtimeController.cancelExecution(workspaceId, executionId);
});
