import { runtimeController } from "@/server/controllers/runtime.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return runtimeController.listHosts(workspaceId);
});

export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return runtimeController.registerHost(req, workspaceId);
});
