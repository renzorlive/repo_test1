import { ok } from "@/server/http";
import { runtimeAgentService, requireRuntimeSession } from "@/server/services";
import type { AgentContext } from "@/server/services";
import {
  agentConnectSchema,
  agentHeartbeatSchema,
  agentReportSchema,
} from "@/validations";

/**
 * The remote-agent protocol controller. Every handler authenticates by the
 * `x-runtime-token` header (a machine, not a user) and never touches user auth.
 */
async function context(req: Request): Promise<AgentContext> {
  const { workspaceId, session, runtime, host } =
    await requireRuntimeSession(req);
  return {
    workspaceId,
    session: { id: session.id },
    runtime: { id: runtime.id },
    host: { id: host.id },
  };
}

export const runtimeAgentController = {
  async connect(req: Request) {
    const ctx = await context(req);
    const input = agentConnectSchema.parse(await req.json().catch(() => ({})));
    return ok(await runtimeAgentService.connect(ctx, input));
  },

  async heartbeat(req: Request) {
    const ctx = await context(req);
    const input = agentHeartbeatSchema.parse(await req.json().catch(() => ({})));
    return ok(await runtimeAgentService.heartbeat(ctx, input));
  },

  async claim(req: Request) {
    const ctx = await context(req);
    return ok(await runtimeAgentService.claim(ctx));
  },

  async report(req: Request) {
    const ctx = await context(req);
    const input = agentReportSchema.parse(await req.json());
    return ok(await runtimeAgentService.report(ctx, input));
  },
};
