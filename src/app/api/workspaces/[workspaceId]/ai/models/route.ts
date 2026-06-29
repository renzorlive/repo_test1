import { aiController } from "@/server/controllers/ai.controller";
import { route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return aiController.createModel(req, workspaceId);
});
