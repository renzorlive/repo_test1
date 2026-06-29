import type { Prisma } from "@prisma/client";
import {
  aiExecutionRepository,
  aiWorkerRepository,
  aiQueueRepository,
  missionRepository,
  projectRepository,
  type AiExecutionListItem,
} from "@/server/repositories";
import { requireAiAccess, requireExecutionAccess } from "@/server/services/ai-access";
import { executionEngine } from "@/server/ai/execution-engine";
import { NotFoundError } from "@/server/errors";
import type { Paginated, AiExecutionState } from "@/types";
import type { ListQuery } from "@/validations/common";
import type {
  SubmitExecutionInput,
  CompleteExecutionInput,
  FailExecutionInput,
  RejectExecutionInput,
} from "@/validations";

/**
 * AiExecutionService — the authorized facade over the Execution Engine.
 * Verifies tenancy + capability, validates optional scoping, then delegates
 * all state-machine behavior to the engine. No orchestration logic leaks here.
 */
export const aiExecutionService = {
  async list(
    workspaceId: string,
    query: ListQuery & { state?: AiExecutionState },
  ): Promise<Paginated<AiExecutionListItem>> {
    await requireAiAccess(workspaceId, "view");
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await aiExecutionRepository.listByWorkspace(
      workspaceId,
      { skip, take: query.pageSize, state: query.state },
    );
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.ceil(total / query.pageSize),
    };
  },

  async getAggregate(workspaceId: string, executionId: string) {
    await requireExecutionAccess(workspaceId, executionId, "view");
    const aggregate = await aiExecutionRepository.findAggregate(executionId);
    if (!aggregate) throw new NotFoundError("Execution not found");
    return aggregate;
  },

  async submit(workspaceId: string, input: SubmitExecutionInput) {
    const { user } = await requireAiAccess(workspaceId, "run");
    await this.assertScoping(workspaceId, input);

    const worker = input.workerId
      ? await aiWorkerRepository.findById(input.workerId)
      : null;
    const maxAttempts = worker ? worker.maxRetries + 1 : 3;

    const data: Prisma.AiExecutionCreateInput = {
      title: input.title,
      state: "QUEUED",
      priority: input.priority,
      maxAttempts,
      requiresApproval: input.requiresApproval,
      input: {
        userRequest: input.userRequest,
        requiredCapability: input.requiredCapability,
        systemInstructions: input.systemInstructions,
        outputFormat: input.outputFormat,
        constraints: input.constraints,
        params: input.params,
      } as Prisma.InputJsonValue,
      workspace: { connect: { id: workspaceId } },
      requestedBy: { connect: { id: user.id } },
      ...(input.missionId ? { mission: { connect: { id: input.missionId } } } : {}),
      ...(input.taskId ? { task: { connect: { id: input.taskId } } } : {}),
      ...(input.projectId ? { project: { connect: { id: input.projectId } } } : {}),
      ...(input.queueId ? { queue: { connect: { id: input.queueId } } } : {}),
      ...(input.workerId ? { worker: { connect: { id: input.workerId } } } : {}),
    };

    const execution = await aiExecutionRepository.create(data);
    await executionEngine.onQueued(execution.id);
    // Kick the pipeline immediately; it parks at RUNNING (awaiting a worker
    // callback) or WAITING_APPROVAL, never blocking the request.
    await executionEngine.advance(execution);
    return this.getAggregate(workspaceId, execution.id);
  },

  async advance(workspaceId: string, executionId: string) {
    const { execution } = await requireExecutionAccess(workspaceId, executionId, "run");
    await executionEngine.advance(execution);
    return this.getAggregate(workspaceId, executionId);
  },

  async approve(workspaceId: string, executionId: string) {
    await requireExecutionAccess(workspaceId, executionId, "approve");
    await executionEngine.approve(executionId);
    return this.getAggregate(workspaceId, executionId);
  },

  async reject(
    workspaceId: string,
    executionId: string,
    input: RejectExecutionInput,
  ) {
    await requireExecutionAccess(workspaceId, executionId, "approve");
    await executionEngine.reject(executionId, input.reason);
    return this.getAggregate(workspaceId, executionId);
  },

  async cancel(workspaceId: string, executionId: string) {
    await requireExecutionAccess(workspaceId, executionId, "run");
    await executionEngine.cancel(executionId);
    return this.getAggregate(workspaceId, executionId);
  },

  async retry(workspaceId: string, executionId: string) {
    await requireExecutionAccess(workspaceId, executionId, "run");
    await executionEngine.retry(executionId);
    await executionEngine.advance(
      (await aiExecutionRepository.findCore(executionId))!,
    );
    return this.getAggregate(workspaceId, executionId);
  },

  /** Worker callback: report a successful result. */
  async complete(
    workspaceId: string,
    executionId: string,
    input: CompleteExecutionInput,
  ) {
    await requireExecutionAccess(workspaceId, executionId, "run");
    await executionEngine.complete(executionId, input);
    return this.getAggregate(workspaceId, executionId);
  },

  /** Worker callback: report a failure (with optional retry). */
  async fail(
    workspaceId: string,
    executionId: string,
    input: FailExecutionInput,
  ) {
    await requireExecutionAccess(workspaceId, executionId, "run");
    await executionEngine.fail(executionId, input.error, input.retry);
    return this.getAggregate(workspaceId, executionId);
  },

  /** Validate that any optional scoping targets live in this workspace. */
  async assertScoping(workspaceId: string, input: SubmitExecutionInput) {
    if (input.missionId) {
      const mission = await missionRepository.findCore(input.missionId);
      if (!mission || mission.workspaceId !== workspaceId) {
        throw new NotFoundError("Mission not found");
      }
    }
    if (input.projectId) {
      const project = await projectRepository.findById(input.projectId);
      if (!project || project.workspaceId !== workspaceId) {
        throw new NotFoundError("Project not found");
      }
    }
    if (input.queueId) {
      const queue = await aiQueueRepository.findById(input.queueId);
      if (!queue || queue.workspaceId !== workspaceId) {
        throw new NotFoundError("Queue not found");
      }
    }
    if (input.workerId) {
      const worker = await aiWorkerRepository.findById(input.workerId);
      if (!worker || worker.workspaceId !== workspaceId) {
        throw new NotFoundError("Worker not found");
      }
    }
  },
};
