import {
  runtimeExecutionRepository,
  runtimeHostRepository,
} from "@/server/repositories";
import { requireRuntimeAccess } from "@/server/services/runtime-access";
import { runtimeEngine } from "@/server/runtime/runtime-engine";
import { NotFoundError } from "@/server/errors";
import type { RuntimeExecutionStatus } from "@/types";
import type { DispatchCommandInput } from "@/validations";

async function requireExecution(workspaceId: string, executionId: string) {
  const execution = await runtimeExecutionRepository.findCore(executionId);
  if (!execution || execution.workspaceId !== workspaceId) {
    throw new NotFoundError("Execution not found");
  }
  return execution;
}

/** User-facing operations over runtime executions. */
export const runtimeExecutionService = {
  async list(workspaceId: string, status?: RuntimeExecutionStatus) {
    await requireRuntimeAccess(workspaceId, "view");
    return runtimeExecutionRepository.listByWorkspace(workspaceId, {
      status: status ? { equals: status } : undefined,
      take: 50,
    });
  },

  async getAggregate(workspaceId: string, executionId: string) {
    await requireRuntimeAccess(workspaceId, "view");
    const aggregate = await runtimeExecutionRepository.findAggregate(executionId);
    if (!aggregate || aggregate.workspaceId !== workspaceId) {
      throw new NotFoundError("Execution not found");
    }
    return aggregate;
  },

  /** Dispatch a generic command/job to a host. */
  async dispatchCommand(workspaceId: string, input: DispatchCommandInput) {
    await requireRuntimeAccess(workspaceId, "operate");
    const host = await runtimeHostRepository.findById(input.hostId);
    if (!host || host.workspaceId !== workspaceId) {
      throw new NotFoundError("Host not found");
    }
    const execution = await runtimeEngine.enqueue({
      workspaceId,
      hostId: input.hostId,
      command: {
        name: input.name,
        command: input.command,
        args: input.args,
        cwd: input.cwd,
        env: input.env,
        prompt: input.prompt,
        timeoutMs: input.timeoutMs,
      },
      aiExecutionId: input.aiExecutionId,
    });
    return this.getAggregate(workspaceId, execution.id);
  },

  async cancel(workspaceId: string, executionId: string) {
    await requireRuntimeAccess(workspaceId, "operate");
    await requireExecution(workspaceId, executionId);
    await runtimeEngine.cancel(executionId);
    return this.getAggregate(workspaceId, executionId);
  },

  async retry(workspaceId: string, executionId: string) {
    await requireRuntimeAccess(workspaceId, "operate");
    const execution = await requireExecution(workspaceId, executionId);
    await runtimeEngine.retry(executionId);
    if (execution.hostId) await runtimeEngine.dispatch(executionId, execution.hostId);
    return this.getAggregate(workspaceId, executionId);
  },
};
