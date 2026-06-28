import { projectService } from "@/server/services";
import { updateProjectSchema } from "@/validations";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string; projectId: string }> };

/** GET /api/workspaces/:workspaceId/projects/:projectId */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, projectId } = await params;
  const project = await projectService.getById(workspaceId, projectId);
  return ok(project);
});

/** PATCH /api/workspaces/:workspaceId/projects/:projectId */
export const PATCH = route(async (req: Request, { params }: Params) => {
  const { workspaceId, projectId } = await params;
  const input = updateProjectSchema.parse(await req.json());
  const project = await projectService.update(workspaceId, projectId, input);
  return ok(project);
});

/** DELETE /api/workspaces/:workspaceId/projects/:projectId */
export const DELETE = route(async (_req: Request, { params }: Params) => {
  const { workspaceId, projectId } = await params;
  await projectService.remove(workspaceId, projectId);
  return ok({ id: projectId });
});
