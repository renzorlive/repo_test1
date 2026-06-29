import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET — list runtime jobs (optionally ?status=). */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return runtimeController.listExecutions(req, workspaceId);
});

/** POST — dispatch a generic command/job to a host. */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return runtimeController.dispatchCommand(req, workspaceId);
});
