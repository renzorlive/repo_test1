import { runtimeAgentController } from "@/server/controllers/runtime-agent.controller";
import { route } from "@/server/http";

// Token-authenticated (x-runtime-token). Excluded from user-auth middleware.
export const POST = route((req: Request) => runtimeAgentController.connect(req));
