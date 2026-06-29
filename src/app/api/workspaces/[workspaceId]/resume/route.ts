import { resumeService } from "@/server/services";
import { resumeSchema } from "@/validations";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/**
 * POST — the product nucleus. One sentence ("Resume GOCO", "Resume yesterday")
 * → a Resume Package: the objective, what you were doing, what blocks you, the
 * decisions, the files, the one next action, confidence and time-to-resume.
 */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const { sentence } = resumeSchema.parse(await req.json());
  return ok(await resumeService.resume(workspaceId, sentence));
});
