import { agentService } from "@/server/services";
import { updateAgentSchema } from "@/validations";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; agentId: string }> };

/** GET /api/workspaces/:workspaceId/agents/:agentId */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, agentId } = await params;
  const agent = await agentService.getById(workspaceId, agentId);
  return ok(agent);
});

/** PATCH /api/workspaces/:workspaceId/agents/:agentId */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, agentId } = await params;
  const input = updateAgentSchema.parse(await req.json());
  const agent = await agentService.update(workspaceId, agentId, input);
  return ok(agent);
});

/** DELETE /api/workspaces/:workspaceId/agents/:agentId */
export const DELETE = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, agentId } = await params;
  await agentService.remove(workspaceId, agentId);
  return ok({ id: agentId });
});
