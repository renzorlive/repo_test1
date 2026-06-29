import { z } from "zod";
import { ok } from "@/server/http";
import {
  aiProviderService,
  aiWorkerService,
  aiQueueService,
  aiExecutionService,
  aiInboxService,
  aiDashboardService,
} from "@/server/services";
import {
  createProviderSchema,
  createModelSchema,
  createWorkerSchema,
  updateWorkerSchema,
  createQueueSchema,
  submitExecutionSchema,
  completeExecutionSchema,
  failExecutionSchema,
  rejectExecutionSchema,
} from "@/validations";
import { listQuerySchema } from "@/validations/common";

const executionListQuery = listQuerySchema.extend({
  state: z
    .enum([
      "QUEUED",
      "PREPARING",
      "BUILDING_CONTEXT",
      "RUNNING",
      "WAITING_APPROVAL",
      "COMPLETED",
      "FAILED",
      "CANCELLED",
      "RETRYING",
    ])
    .optional(),
});

/**
 * AiController — HTTP↔service mapping for the AI Orchestrator. Route handlers
 * delegate here; all parsing + status codes live in one place.
 */
export const aiController = {
  // ---- Providers & models ---------------------------------------------------

  async listProviders(workspaceId: string) {
    return ok(await aiProviderService.list(workspaceId));
  },
  async createProvider(req: Request, workspaceId: string) {
    const input = createProviderSchema.parse(await req.json());
    return ok(await aiProviderService.create(workspaceId, input), { status: 201 });
  },
  async createModel(req: Request, workspaceId: string) {
    const input = createModelSchema.parse(await req.json());
    return ok(await aiProviderService.createModel(workspaceId, input), {
      status: 201,
    });
  },

  // ---- Workers --------------------------------------------------------------

  async listWorkers(workspaceId: string) {
    return ok(await aiWorkerService.list(workspaceId));
  },
  async createWorker(req: Request, workspaceId: string) {
    const input = createWorkerSchema.parse(await req.json());
    return ok(await aiWorkerService.create(workspaceId, input), { status: 201 });
  },
  async updateWorker(req: Request, workspaceId: string, workerId: string) {
    const input = updateWorkerSchema.parse(await req.json());
    return ok(await aiWorkerService.update(workspaceId, workerId, input));
  },

  // ---- Queues ---------------------------------------------------------------

  async listQueues(workspaceId: string) {
    return ok(await aiQueueService.list(workspaceId));
  },
  async createQueue(req: Request, workspaceId: string) {
    const input = createQueueSchema.parse(await req.json());
    return ok(await aiQueueService.create(workspaceId, input), { status: 201 });
  },

  // ---- Executions -----------------------------------------------------------

  async listExecutions(req: Request, workspaceId: string) {
    const { searchParams } = new URL(req.url);
    const query = executionListQuery.parse(Object.fromEntries(searchParams));
    return ok(await aiExecutionService.list(workspaceId, query));
  },
  async submitExecution(req: Request, workspaceId: string) {
    const input = submitExecutionSchema.parse(await req.json());
    return ok(await aiExecutionService.submit(workspaceId, input), {
      status: 201,
    });
  },
  async getExecution(workspaceId: string, executionId: string) {
    return ok(await aiExecutionService.getAggregate(workspaceId, executionId));
  },
  async advanceExecution(workspaceId: string, executionId: string) {
    return ok(await aiExecutionService.advance(workspaceId, executionId));
  },
  async approveExecution(workspaceId: string, executionId: string) {
    return ok(await aiExecutionService.approve(workspaceId, executionId));
  },
  async rejectExecution(req: Request, workspaceId: string, executionId: string) {
    const input = rejectExecutionSchema.parse(await req.json().catch(() => ({})));
    return ok(await aiExecutionService.reject(workspaceId, executionId, input));
  },
  async cancelExecution(workspaceId: string, executionId: string) {
    return ok(await aiExecutionService.cancel(workspaceId, executionId));
  },
  async retryExecution(workspaceId: string, executionId: string) {
    return ok(await aiExecutionService.retry(workspaceId, executionId));
  },
  async completeExecution(req: Request, workspaceId: string, executionId: string) {
    const input = completeExecutionSchema.parse(await req.json());
    return ok(await aiExecutionService.complete(workspaceId, executionId, input));
  },
  async failExecution(req: Request, workspaceId: string, executionId: string) {
    const input = failExecutionSchema.parse(await req.json());
    return ok(await aiExecutionService.fail(workspaceId, executionId, input));
  },

  // ---- Inbox & dashboard ----------------------------------------------------

  async inbox(workspaceId: string) {
    return ok(await aiInboxService.get(workspaceId));
  },
  async dashboard(workspaceId: string) {
    return ok(await aiDashboardService.getOverview(workspaceId));
  },
};
