import { missionService } from "@/server/services";
import { createMissionSchema } from "@/validations";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspaces/:workspaceId/missions */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const missions = await missionService.listByWorkspace(workspaceId);
  return ok(missions);
});

/** POST /api/workspaces/:workspaceId/missions */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const input = createMissionSchema.parse(await req.json());
  const mission = await missionService.create(workspaceId, input);
  return ok(mission, { status: 201 });
});
