import { dashboardService } from "@/server/services";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/** GET /api/workspaces/:workspaceId/dashboard — command-center overview. */
export const GET = route(async (_req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  return ok(await dashboardService.getOverview(workspaceId));
});
