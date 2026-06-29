import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = {
  params: Promise<{ workspaceId: string; executionId: string }>;
};

/** GET — full runtime execution aggregate (terminal, logs, artifacts). */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, executionId } = await params;
  return runtimeController.getExecution(workspaceId, executionId);
});
