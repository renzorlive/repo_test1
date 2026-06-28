import { agentService } from "@/server/services";
import { createAgentSchema } from "@/validations";
import { listQuerySchema } from "@/validations/common";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspaces/:workspaceId/agents */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const { searchParams } = new URL(req.url);
  const query = listQuerySchema.parse(Object.fromEntries(searchParams));
  const result = await agentService.list(workspaceId, query);
  return ok(result);
});

/** POST /api/workspaces/:workspaceId/agents */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const input = createAgentSchema.parse(await req.json());
  const agent = await agentService.create(workspaceId, input);
  return ok(agent, { status: 201 });
});
