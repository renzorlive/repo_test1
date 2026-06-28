import { projectService } from "@/server/services";
import { createProjectSchema } from "@/validations";
import { listQuerySchema } from "@/validations/common";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspaces/:workspaceId/projects */
export const GET = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const { searchParams } = new URL(req.url);
  const query = listQuerySchema.parse(Object.fromEntries(searchParams));
  const result = await projectService.list(workspaceId, query);
  return ok(result);
});

/** POST /api/workspaces/:workspaceId/projects */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const input = createProjectSchema.parse(await req.json());
  const project = await projectService.create(workspaceId, input);
  return ok(project, { status: 201 });
});
