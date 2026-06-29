import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET — Host Dashboard overview. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return runtimeController.dashboard(workspaceId);
});
