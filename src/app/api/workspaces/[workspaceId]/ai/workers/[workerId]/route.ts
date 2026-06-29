import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; workerId: string }> };

/** PATCH — update worker config, status, health or heartbeat. */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, workerId } = await params;
  return aiController.updateWorker(req, workspaceId, workerId);
});
