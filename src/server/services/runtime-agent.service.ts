import type { Prisma } from "@prisma/client";
import {
  runtimeHostRepository,
  runtimeRepository,
  runtimeExecutionRepository,
} from "@/server/repositories";
import { runtimeEngine } from "@/server/runtime/runtime-engine";
import { runtimeBridgeService } from "@/server/services/runtime-bridge.service";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import type { AgentConnectInput, AgentReportInput } from "@/validations";

/** The resolved identity of a connected agent (from its session token). */
export interface AgentContext {
  workspaceId: string;
  session: { id: string };
  runtime: { id: string };
  host: { id: string };
}

/**
 * RuntimeAgentService — the protocol a remote machine speaks. Authentication is
 * by session token (handled in the route via `requireRuntimeSession`), not a
 * user session. This is what makes Claude Code a worker on another machine.
 */
export const runtimeAgentService = {
  /** The agent comes online and reports its real specs. */
  async connect(ctx: AgentContext, input: AgentConnectInput) {
    const data: Prisma.RuntimeHostUpdateInput = {
      status: "ONLINE",
      lastSeenAt: new Date(),
    };
    if (input.hostname) data.hostname = input.hostname;
    if (input.os) data.os = input.os;
    if (input.arch) data.arch = input.arch;
    if (input.cpuCores) data.cpuCores = input.cpuCores;
    if (input.cpuModel) data.cpuModel = input.cpuModel;
    if (input.memoryMb !== undefined) data.memoryMb = input.memoryMb;
    if (input.gpu) data.gpu = input.gpu;
    if (input.agentVersion) data.agentVersion = input.agentVersion;

    await runtimeHostRepository.updateHost(ctx.host.id, data);
    await runtimeRepository.updateStatus(ctx.runtime.id, { status: "ONLINE" });
    await runtimeHostRepository.updateSession(ctx.session.id, {
      status: "CONNECTED",
      lastHeartbeatAt: new Date(),
    });
    return { runtimeId: ctx.runtime.id };
  },

  /** Host-level liveness ping. */
  async heartbeat(
    ctx: AgentContext,
    metrics: { cpuPct?: number; memMb?: number },
  ) {
    await runtimeHostRepository.updateHost(ctx.host.id, {
      status: "ONLINE",
      lastSeenAt: new Date(),
    });
    await runtimeHostRepository.updateSession(ctx.session.id, {
      lastHeartbeatAt: new Date(),
    });
    await runtimeHostRepository.createHeartbeat({
      host: { connect: { id: ctx.host.id } },
      cpuPct: metrics.cpuPct,
      memMb: metrics.memMb,
    });
    return { ok: true };
  },

  /** Claim the next dispatched job for this agent's runtime. */
  async claim(ctx: AgentContext) {
    const job = await runtimeEngine.claim(ctx.runtime.id);
    return { job };
  },

  /**
   * Stream back logs/artifacts/heartbeat and/or finalize. Returns whether
   * cancellation has been requested so the agent can stop cooperatively.
   */
  async report(ctx: AgentContext, input: AgentReportInput) {
    const execution = await runtimeExecutionRepository.findCore(input.executionId);
    if (!execution || execution.workspaceId !== ctx.workspaceId) {
      throw new NotFoundError("Execution not found");
    }
    if (execution.runtimeId && execution.runtimeId !== ctx.runtime.id) {
      throw new ForbiddenError("Execution belongs to another runtime");
    }

    if (input.logs?.length) {
      await runtimeEngine.appendLogs(input.executionId, input.logs);
    }
    if (input.heartbeat) {
      await runtimeEngine.heartbeat(input.executionId, input.heartbeat);
    }
    if (input.artifacts?.length) {
      await runtimeEngine.recordArtifacts(input.executionId, input.artifacts);
    }
    if (input.complete) {
      await runtimeEngine.complete(input.executionId, input.complete.exitCode);
      // Bridge back to the orchestration layer (mission timeline + artifacts).
      await runtimeBridgeService.onRuntimeFinished(input.executionId);
    }

    const after = await runtimeExecutionRepository.findCore(input.executionId);
    return { cancelRequested: after?.cancelRequested ?? false };
  },
};
