import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; hostId: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, hostId } = await params;
  return runtimeController.getHost(workspaceId, hostId);
});
