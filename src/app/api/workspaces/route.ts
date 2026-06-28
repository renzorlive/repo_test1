import { workspaceService } from "@/server/services";
import { createWorkspaceSchema } from "@/validations";
import { ok, route } from "@/server/http";

/** GET /api/workspaces — workspaces the current user belongs to. */
export const GET = route(async () => {
  const workspaces = await workspaceService.listForCurrentUser();
  return ok(workspaces);
});

/** POST /api/workspaces — create a new workspace owned by the current user. */
export const POST = route(async (req: Request) => {
  const body = await req.json();
  const input = createWorkspaceSchema.parse(body);
  const workspace = await workspaceService.create(input);
  return ok(workspace, { status: 201 });
});
