import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.listWorkers(workspaceId);
});

export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.createWorker(req, workspaceId);
});
