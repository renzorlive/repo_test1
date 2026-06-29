import { runtimeAgentController } from "@/server/controllers/runtime-agent.controller";
import { route } from "@/server/http";

export const POST = route((req: Request) =>
  runtimeAgentController.heartbeat(req),
);
