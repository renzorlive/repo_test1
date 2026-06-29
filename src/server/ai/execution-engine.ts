import type { Prisma } from "@prisma/client";
import {
  aiExecutionRepository,
  aiWorkerRepository,
  missionRepository,
  workspaceRepository,
  type AiWorkerWithRefs,
} from "@/server/repositories";
import { workerRegistry } from "@/server/ai/worker-registry";
import { contextBuilder, type ContextSources } from "@/server/ai/context-builder";
import { promptBuilder } from "@/server/ai/prompt-builder";
import { getProviderAdapter } from "@/server/ai/providers/registry";
import { estimateCost } from "@/server/ai/tokens";
import type { PromptMessage } from "@/server/ai/types";
import { AppError, NotFoundError } from "@/server/errors";
import type {
  AiCapabilityKind,
  AiExecution,
  AiExecutionEventType,
  AiExecutionState,
} from "@/types";

// ---- Internal helpers -------------------------------------------------------

interface ExecutionInput {
  userRequest: string;
  requiredCapability: AiCapabilityKind;
  systemInstructions?: string;
  outputFormat?: string;
  constraints: string[];
}

function parseInput(value: Prisma.JsonValue | null): ExecutionInput {
  const o = (value ?? {}) as Record<string, unknown>;
  return {
    userRequest: typeof o.userRequest === "string" ? o.userRequest : "",
    requiredCapability:
      (o.requiredCapability as AiCapabilityKind) ?? "TEXT_GENERATION",
    systemInstructions:
      typeof o.systemInstructions === "string" ? o.systemInstructions : undefined,
    outputFormat: typeof o.outputFormat === "string" ? o.outputFormat : undefined,
    constraints: Array.isArray(o.constraints)
      ? (o.constraints as unknown[]).filter((c): c is string => typeof c === "string")
      : [],
  };
}

/** The per-state timestamp column to stamp on each transition. */
function stamp(state: AiExecutionState): Prisma.AiExecutionUpdateInput {
  const now = new Date();
  switch (state) {
    case "QUEUED":
      return { queuedAt: now };
    case "PREPARING":
      return { preparingAt: now };
    case "BUILDING_CONTEXT":
      return { contextBuiltAt: now };
    case "RUNNING":
      return { runningAt: now };
    case "WAITING_APPROVAL":
      return { waitingApprovalAt: now };
    case "COMPLETED":
      return { completedAt: now };
    case "FAILED":
      return { failedAt: now };
    case "CANCELLED":
      return { cancelledAt: now };
    case "RETRYING":
      return { retryingAt: now };
  }
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function asReferences(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    v && typeof v === "object" && "url" in v && "label" in v
      ? [
          {
            label: String((v as Record<string, unknown>).label),
            url: String((v as Record<string, unknown>).url),
          },
        ]
      : [],
  );
}

const TERMINAL: AiExecutionState[] = ["COMPLETED", "FAILED", "CANCELLED"];

/**
 * The generic AI Execution Engine.
 *
 * Drives executions through the state machine
 * QUEUED → PREPARING → BUILDING_CONTEXT → RUNNING → (WAITING_APPROVAL) →
 * COMPLETED / FAILED / CANCELLED / RETRYING, persisting a timestamp and an
 * event for every transition. It selects workers via the registry, builds
 * context + prompts via the builders, and dispatches through the provider
 * adapter interface. With no adapter registered (the current state) it parks
 * the execution in RUNNING awaiting an external worker callback — it never
 * couples to a vendor SDK.
 */
export const executionEngine = {
  /** Emit the initial QUEUED event after the service creates the row. */
  async onQueued(executionId: string) {
    await emit(executionId, "QUEUED", "Execution queued");
  },

  /**
   * Drive an execution forward as far as it can go in one pass. Safe to call
   * repeatedly (idempotent per state).
   */
  async advance(execution: AiExecution): Promise<AiExecution> {
    let exec = execution;
    const input = parseInput(exec.input);

    if (exec.state === "QUEUED" || exec.state === "RETRYING") {
      await emit(exec.id, "STARTED", "Execution started");
      exec = await setState(exec.id, "PREPARING");
    }

    if (exec.state !== "PREPARING") return exec;

    // Worker selection
    let worker: AiWorkerWithRefs | null = exec.workerId
      ? await aiWorkerRepository.findById(exec.workerId)
      : null;
    if (!worker) {
      worker = await workerRegistry.select(exec.workspaceId, input.requiredCapability);
      if (!worker) {
        await log(
          exec.id,
          "WARN",
          `No available worker for capability ${input.requiredCapability}; awaiting capacity.`,
        );
        return exec; // stays PREPARING until capacity frees
      }
    }
    exec = await aiExecutionRepository.update(exec.id, {
      worker: { connect: { id: worker.id } },
    });
    await aiWorkerRepository.update(worker.id, {
      status: "BUSY",
      lastSeenAt: new Date(),
    });
    await emit(exec.id, "PROVIDER_SELECTED", `Worker "${worker.name}" selected`, {
      workerId: worker.id,
      provider: worker.provider.type,
      model: worker.model.name,
    });

    // Context
    exec = await setState(exec.id, "BUILDING_CONTEXT");
    const sources = await gatherSources(exec);
    const context = contextBuilder.build(sources);
    await emit(exec.id, "CONTEXT_READY", "Context assembled", {
      sections: context.sections.length,
      tokensEstimated: context.totalTokensEstimated,
    });

    // Prompt (versioned)
    const version = await aiExecutionRepository.nextPromptVersion(exec.id);
    const prompt = promptBuilder.build({
      version,
      systemInstructions: input.systemInstructions,
      userRequest: input.userRequest,
      constraints: input.constraints,
      outputFormat: input.outputFormat,
      context,
    });
    await aiExecutionRepository.createPrompt({
      execution: { connect: { id: exec.id } },
      version: prompt.version,
      systemInstructions: prompt.systemInstructions,
      userRequest: prompt.userRequest,
      outputFormat: prompt.outputFormat,
      constraints: prompt.constraints as unknown as Prisma.InputJsonValue,
      messages: prompt.messages as unknown as Prisma.InputJsonValue,
      contextPackage: prompt.contextPackage as unknown as Prisma.InputJsonValue,
      tokensEstimated: prompt.tokensEstimated,
      hash: prompt.hash,
    });
    await emit(exec.id, "PROMPT_GENERATED", `Prompt v${version} generated`, {
      version,
      hash: prompt.hash,
    });

    // Running
    exec = await setState(exec.id, "RUNNING");
    await emit(exec.id, "RUNNING", "Execution running");

    if (exec.requiresApproval) {
      exec = await setState(exec.id, "WAITING_APPROVAL");
      await emit(exec.id, "WAITING_APPROVAL", "Awaiting human approval");
      return exec;
    }

    return dispatch(exec, worker, prompt.messages);
  },

  /** Worker callback: the execution finished successfully. */
  async complete(
    executionId: string,
    payload: {
      content?: string;
      structured?: unknown;
      finishReason?: string;
      model?: string;
      confidence?: number;
      inputTokens: number;
      outputTokens: number;
      latencyMs?: number;
    },
  ): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");

    const worker = exec.workerId
      ? await aiWorkerRepository.findById(exec.workerId)
      : null;
    const cost = estimateCost(
      payload.inputTokens,
      payload.outputTokens,
      worker?.inputCostPer1k ?? 0,
      worker?.outputCostPer1k ?? 0,
    );

    await aiExecutionRepository.upsertUsage(executionId, exec.workspaceId, {
      inputTokens: payload.inputTokens,
      outputTokens: payload.outputTokens,
      totalTokens: payload.inputTokens + payload.outputTokens,
      latencyMs: payload.latencyMs,
    });
    await aiExecutionRepository.upsertCost(executionId, exec.workspaceId, {
      inputCost: cost.inputCost,
      outputCost: cost.outputCost,
      totalCost: cost.totalCost,
    });
    await aiExecutionRepository.upsertResult(executionId, {
      content: payload.content,
      structured: (payload.structured ?? undefined) as Prisma.InputJsonValue | undefined,
      finishReason: payload.finishReason,
      model: payload.model ?? worker?.model.name,
      confidence: payload.confidence,
    });

    const updated = await setState(executionId, "COMPLETED", {
      confidence: payload.confidence,
    });
    await emit(executionId, "COMPLETED", "Execution completed", {
      totalCost: cost.totalCost,
      totalTokens: payload.inputTokens + payload.outputTokens,
    });
    if (worker) {
      await aiWorkerRepository.update(worker.id, {
        status: "IDLE",
        lastSeenAt: new Date(),
      });
    }
    return updated;
  },

  /** Worker callback: the execution failed; retry if budget remains. */
  async fail(
    executionId: string,
    error: string,
    retry = true,
  ): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");

    if (exec.workerId) {
      await aiWorkerRepository.update(exec.workerId, { status: "IDLE" });
    }

    if (retry && exec.attempt < exec.maxAttempts) {
      const updated = await aiExecutionRepository.update(executionId, {
        state: "RETRYING",
        ...stamp("RETRYING"),
        attempt: exec.attempt + 1,
        error,
      });
      await emit(executionId, "RETRY_SCHEDULED", `Retry scheduled (attempt ${exec.attempt + 1})`, {
        error,
      });
      return updated;
    }

    const updated = await setState(executionId, "FAILED", { error });
    await emit(executionId, "FAILED", "Execution failed", { error });
    return updated;
  },

  async approve(executionId: string): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");
    if (exec.state !== "WAITING_APPROVAL") {
      throw new AppError("Execution is not awaiting approval", 409, "INVALID_STATE");
    }
    const updated = await setState(executionId, "RUNNING");
    await emit(executionId, "APPROVED", "Execution approved");

    const worker = exec.workerId
      ? await aiWorkerRepository.findById(exec.workerId)
      : null;
    const prompt = await aiExecutionRepository.latestPrompt(executionId);
    if (worker && prompt) {
      return dispatch(updated, worker, prompt.messages as unknown as PromptMessage[]);
    }
    return updated; // awaiting external worker callback
  },

  async reject(executionId: string, reason?: string): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");
    if (exec.state !== "WAITING_APPROVAL") {
      throw new AppError("Execution is not awaiting approval", 409, "INVALID_STATE");
    }
    const updated = await setState(executionId, "CANCELLED", {
      error: reason ?? "Rejected by reviewer",
    });
    await emit(executionId, "REJECTED", "Execution rejected", { reason });
    if (exec.workerId) {
      await aiWorkerRepository.update(exec.workerId, { status: "IDLE" });
    }
    return updated;
  },

  async cancel(executionId: string): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");
    if (TERMINAL.includes(exec.state)) {
      throw new AppError("Execution already finished", 409, "INVALID_STATE");
    }
    const updated = await setState(executionId, "CANCELLED");
    await emit(executionId, "CANCELLED", "Execution cancelled");
    if (exec.workerId) {
      await aiWorkerRepository.update(exec.workerId, { status: "IDLE" });
    }
    return updated;
  },

  /** Manual retry of a failed execution. */
  async retry(executionId: string): Promise<AiExecution> {
    const exec = await aiExecutionRepository.findCore(executionId);
    if (!exec) throw new NotFoundError("Execution not found");
    if (exec.state !== "FAILED") {
      throw new AppError("Only failed executions can be retried", 409, "INVALID_STATE");
    }
    const updated = await aiExecutionRepository.update(executionId, {
      state: "RETRYING",
      ...stamp("RETRYING"),
      attempt: exec.attempt + 1,
      maxAttempts: Math.max(exec.maxAttempts, exec.attempt + 1),
      error: null,
    });
    await emit(executionId, "RETRY_SCHEDULED", "Manual retry scheduled");
    return updated;
  },
};

// ---- Private engine internals ----------------------------------------------

async function setState(
  executionId: string,
  state: AiExecutionState,
  patch: Prisma.AiExecutionUpdateInput = {},
): Promise<AiExecution> {
  return aiExecutionRepository.update(executionId, {
    state,
    ...stamp(state),
    ...patch,
  });
}

async function emit(
  executionId: string,
  type: AiExecutionEventType,
  message?: string,
  data?: Record<string, unknown>,
) {
  await aiExecutionRepository.createEvent({
    execution: { connect: { id: executionId } },
    type,
    message,
    data: (data ?? {}) as Prisma.InputJsonValue,
  });
}

async function log(
  executionId: string,
  level: "DEBUG" | "INFO" | "WARN" | "ERROR",
  message: string,
  data?: Record<string, unknown>,
) {
  await aiExecutionRepository.createLog({
    execution: { connect: { id: executionId } },
    level,
    message,
    data: (data ?? {}) as Prisma.InputJsonValue,
  });
}

/**
 * Dispatch a RUNNING execution to its provider adapter. With no adapter
 * registered, the execution stays RUNNING and waits for an external worker to
 * report back via complete()/fail() — the orchestrator never blocks on a vendor.
 */
async function dispatch(
  exec: AiExecution,
  worker: AiWorkerWithRefs,
  messages: PromptMessage[],
): Promise<AiExecution> {
  const adapter = getProviderAdapter(worker.provider.type);
  if (!adapter) {
    await log(
      exec.id,
      "INFO",
      `No provider adapter registered for ${worker.provider.type}; dispatched, awaiting external worker callback.`,
    );
    return exec;
  }

  try {
    const result = await adapter.execute({
      model: worker.model.name,
      messages,
      temperature: worker.temperature,
      maxTokens: worker.maxTokens,
      timeoutMs: worker.timeoutMs,
      metadata: { executionId: exec.id },
    });
    return executionEngine.complete(exec.id, {
      content: result.content,
      structured: result.structured,
      finishReason: result.finishReason,
      model: result.model,
      confidence: result.confidence,
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
    });
  } catch (e) {
    return executionEngine.fail(
      exec.id,
      e instanceof Error ? e.message : "Provider execution failed",
      true,
    );
  }
}

/** Gather provider-agnostic context sources from repositories. */
async function gatherSources(exec: AiExecution): Promise<ContextSources> {
  const workspace = await workspaceRepository.findById(exec.workspaceId);
  const base: ContextSources = {
    workspace: {
      id: exec.workspaceId,
      name: workspace?.name ?? "Workspace",
    },
    architecture:
      workspace && typeof (workspace.settings as Record<string, unknown>)?.architecture === "string"
        ? ((workspace.settings as Record<string, unknown>).architecture as string)
        : null,
  };

  if (!exec.missionId) return base;

  const mission = await missionRepository.findAggregate(exec.missionId);
  if (!mission) return base;

  return {
    ...base,
    project: mission.project
      ? { id: mission.project.id, key: mission.project.key, name: mission.project.name }
      : null,
    mission: {
      id: mission.id,
      title: mission.title,
      status: mission.status,
      objective: mission.objective,
      summary: mission.summary,
      outcome: mission.outcome,
      context: mission.context
        ? {
            background: mission.context.background,
            constraints: asStringArray(mission.context.constraints),
            assumptions: asStringArray(mission.context.assumptions),
            references: asReferences(mission.context.references),
          }
        : null,
      decisions: mission.decisions.map((d) => ({ title: d.title, outcome: d.outcome })),
      artifacts: mission.artifacts.map((a) => ({ name: a.name, type: a.type })),
      notes: mission.notes.map((n) => ({ body: n.body })),
      aiSessions: mission.aiSessions.map((s) => ({
        title: s.title,
        summary: s.summary,
        status: s.status,
      })),
    },
  };
}
