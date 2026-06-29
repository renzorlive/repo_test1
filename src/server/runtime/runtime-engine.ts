import type { Prisma, RuntimeLogStream } from "@prisma/client";
import {
  runtimeExecutionRepository,
  runtimeRepository,
} from "@/server/repositories";
import { getRuntimeAdapter } from "@/server/runtime/adapter";
import type {
  ClaimedJob,
  RuntimeArtifactRecord,
  RuntimeJobSpec,
  RuntimeLogChunk,
} from "@/server/runtime/types";
import { AppError, NotFoundError } from "@/server/errors";
// Side-effect import: registers the built-in runtime adapters (Claude Code…).
import "@/server/runtime/adapters";

type CommandRow = {
  command: string;
  args: Prisma.JsonValue;
  cwd: string | null;
  env: Prisma.JsonValue;
  prompt: string | null;
  timeoutMs: number;
};

function buildSpec(command: CommandRow): RuntimeJobSpec {
  return {
    command: command.command,
    args: Array.isArray(command.args)
      ? (command.args as unknown[]).map(String)
      : [],
    cwd: command.cwd,
    env:
      command.env && typeof command.env === "object" && !Array.isArray(command.env)
        ? (command.env as Record<string, string>)
        : {},
    prompt: command.prompt,
    timeoutMs: command.timeoutMs,
  };
}

const TERMINATED = ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"];

/**
 * The Runtime Engine drives the generic job state machine:
 *   PENDING → DISPATCHED → RUNNING → SUCCEEDED | FAILED | CANCELLED | TIMED_OUT
 *
 * It knows nothing about missions or AI — it schedules jobs onto runtimes,
 * streams logs/heartbeats/artifacts in from the remote agent, and finalizes on
 * the reported exit code. The orchestration bridge sits OUTSIDE this engine.
 */
export const runtimeEngine = {
  /** Append a terminal line (also used as the adapters' log sink). */
  async log(executionId: string, stream: RuntimeLogStream, content: string) {
    const sequence = await runtimeExecutionRepository.nextLogSequence(executionId);
    await runtimeExecutionRepository.appendLogs([
      { executionId, stream, content, sequence },
    ]);
  },

  /** Create a job and immediately try to place it on the given host. */
  async enqueue(args: {
    workspaceId: string;
    command: Parameters<typeof runtimeExecutionRepository.create>[0]["command"];
    hostId: string;
    aiExecutionId?: string;
  }) {
    const execution = await runtimeExecutionRepository.create({
      workspaceId: args.workspaceId,
      command: args.command,
      aiExecutionId: args.aiExecutionId,
    });
    await this.log(execution.id, "SYSTEM", "Job queued.");
    await this.dispatch(execution.id, args.hostId);
    return execution;
  },

  /** Place a pending job onto a connected runtime on the host (or keep queued). */
  async dispatch(executionId: string, hostId: string) {
    const execution = await runtimeExecutionRepository.findCore(executionId);
    if (!execution) throw new NotFoundError("Execution not found");

    const target = await runtimeRepository.findDispatchTarget(hostId);
    if (!target) {
      await this.log(
        executionId,
        "SYSTEM",
        "No connected runtime on this host yet — job will start when the agent connects.",
      );
      await runtimeExecutionRepository.update(executionId, {
        host: { connect: { id: hostId } },
      });
      return;
    }

    await runtimeExecutionRepository.update(executionId, {
      status: "DISPATCHED",
      dispatchedAt: new Date(),
      host: { connect: { id: hostId } },
      runtime: { connect: { id: target.runtime.id } },
      session: { connect: { id: target.session.id } },
    });
    await runtimeRepository.updateStatus(target.runtime.id, { status: "BUSY" });

    const spec = buildSpec(execution.command);
    const adapter = getRuntimeAdapter(target.runtime.type);
    if (adapter) {
      await adapter.dispatch({
        executionId,
        runtimeType: target.runtime.type,
        spec,
        log: (stream, content) => this.log(executionId, stream, content),
      });
    } else {
      await this.log(
        executionId,
        "SYSTEM",
        `No adapter registered for ${target.runtime.type}.`,
      );
    }
  },

  /** Agent claims the next dispatched job for its runtime. */
  async claim(runtimeId: string): Promise<ClaimedJob | null> {
    const execution = await runtimeExecutionRepository.claimNext(runtimeId);
    if (!execution) return null;

    await runtimeExecutionRepository.update(execution.id, {
      status: "RUNNING",
      startedAt: new Date(),
      lastHeartbeatAt: new Date(),
    });
    await this.log(execution.id, "SYSTEM", "Agent claimed job — execution started.");

    return {
      executionId: execution.id,
      attempt: execution.attempt,
      spec: buildSpec(execution.command),
    };
  },

  async appendLogs(executionId: string, chunks: RuntimeLogChunk[]) {
    if (chunks.length === 0) return;
    let sequence = await runtimeExecutionRepository.nextLogSequence(executionId);
    await runtimeExecutionRepository.appendLogs(
      chunks.map((c) => ({
        executionId,
        stream: c.stream,
        content: c.content,
        sequence: sequence++,
      })),
    );
    await runtimeExecutionRepository.update(executionId, {
      lastHeartbeatAt: new Date(),
    });
  },

  /** Execution heartbeat. Returns whether cancellation has been requested. */
  async heartbeat(
    executionId: string,
    metrics: { cpuPct?: number; memMb?: number; message?: string },
  ) {
    const execution = await runtimeExecutionRepository.findCore(executionId);
    if (!execution) throw new NotFoundError("Execution not found");

    await runtimeExecutionRepository.createHeartbeat({
      execution: { connect: { id: executionId } },
      cpuPct: metrics.cpuPct,
      memMb: metrics.memMb,
      message: metrics.message,
    });
    await runtimeExecutionRepository.update(executionId, {
      lastHeartbeatAt: new Date(),
    });
    return { cancelRequested: execution.cancelRequested };
  },

  async recordArtifacts(executionId: string, records: RuntimeArtifactRecord[]) {
    if (records.length === 0) return;
    await runtimeExecutionRepository.createArtifacts(
      records.map((r) => ({
        executionId,
        path: r.path,
        change: r.change,
        kind: r.kind,
        sizeBytes: r.sizeBytes,
        url: r.url,
      })),
    );
    await this.log(
      executionId,
      "SYSTEM",
      `Detected ${records.length} artifact change(s).`,
    );
  },

  /** Finalize a job on the reported exit code. */
  async complete(executionId: string, exitCode: number) {
    const execution = await runtimeExecutionRepository.findCore(executionId);
    if (!execution) throw new NotFoundError("Execution not found");

    const status = exitCode === 0 ? "SUCCEEDED" : "FAILED";
    const updated = await runtimeExecutionRepository.update(executionId, {
      status,
      exitCode,
      finishedAt: new Date(),
    });
    await runtimeExecutionRepository.updateTerminal(executionId, {
      status: "CLOSED",
      exitCode,
      closedAt: new Date(),
    });
    await this.log(executionId, "SYSTEM", `Process exited with code ${exitCode}.`);
    await this.freeRuntime(executionId);
    return updated;
  },

  async cancel(executionId: string) {
    const execution = await runtimeExecutionRepository.findCore(executionId);
    if (!execution) throw new NotFoundError("Execution not found");
    if (TERMINATED.includes(execution.status)) {
      throw new AppError("Job already finished", 409, "INVALID_STATE");
    }

    await runtimeExecutionRepository.update(executionId, { cancelRequested: true });
    const runtimeType = execution.runtime?.type ?? "CLAUDE_CODE";
    const adapter = getRuntimeAdapter(runtimeType);
    await adapter?.cancel({
      executionId,
      runtimeType,
      log: (stream, content) => this.log(executionId, stream, content),
    });

    // If it never started, we can finalize immediately.
    if (execution.status === "PENDING" || execution.status === "DISPATCHED") {
      await runtimeExecutionRepository.update(executionId, {
        status: "CANCELLED",
        finishedAt: new Date(),
      });
      await runtimeExecutionRepository.updateTerminal(executionId, {
        status: "CLOSED",
        closedAt: new Date(),
      });
      await this.freeRuntime(executionId);
    }
  },

  async retry(executionId: string) {
    const execution = await runtimeExecutionRepository.findCore(executionId);
    if (!execution) throw new NotFoundError("Execution not found");
    if (!TERMINATED.includes(execution.status)) {
      throw new AppError("Only finished jobs can be retried", 409, "INVALID_STATE");
    }
    await runtimeExecutionRepository.update(executionId, {
      status: "PENDING",
      attempt: execution.attempt + 1,
      maxAttempts: Math.max(execution.maxAttempts, execution.attempt + 1),
      exitCode: null,
      error: null,
      finishedAt: null,
      cancelRequested: false,
    });
    await runtimeExecutionRepository.updateTerminal(executionId, {
      status: "OPEN",
      closedAt: null,
      exitCode: null,
    });
    await this.log(executionId, "SYSTEM", "Retry scheduled.");
  },

  /** Return the runtime to ONLINE once a job leaves the in-flight set. */
  async freeRuntime(executionId: string) {
    const exec = await runtimeExecutionRepository.findCore(executionId);
    if (exec?.runtimeId) {
      await runtimeRepository.updateStatus(exec.runtimeId, { status: "ONLINE" });
    }
  },
};
