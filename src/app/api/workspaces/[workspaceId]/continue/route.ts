import { continueService } from "@/server/services";
import { continueSchema } from "@/validations";
import { ok, route } from "@/server/http";

type Params = { params: Promise<{ workspaceId: string }> };

/**
 * POST — the product nucleus. One sentence ("Continue GOCO") → the recovered
 * context: project, where it left off, decisions, files, next steps, confidence.
 */
export const POST = route(async (req: Request, { params }: Params) => {
  const { workspaceId } = await params;
  const { sentence } = continueSchema.parse(await req.json());
  return ok(await continueService.interpret(workspaceId, sentence));
});
