import { z } from "zod";
import { ok } from "@/server/http";
import {
  runtimeHostService,
  runtimeExecutionService,
  runtimeDashboardService,
  runtimeBridgeService,
} from "@/server/services";
import {
  registerHostSchema,
  dispatchCommandSchema,
  dispatchAiExecutionSchema,
} from "@/validations";

const executionStateEnum = z
  .enum([
    "PENDING",
    "DISPATCHED",
    "RUNNING",
    "SUCCEEDED",
    "FAILED",
    "CANCELLED",
    "TIMED_OUT",
  ])
  .optional();

/** HTTP↔service mapping for the user-facing Runtime Layer. */
export const runtimeController = {
  // Hosts
  async listHosts(workspaceId: string) {
    return ok(await runtimeHostService.list(workspaceId));
  },
  async registerHost(req: Request, workspaceId: string) {
    const input = registerHostSchema.parse(await req.json());
    return ok(await runtimeHostService.register(workspaceId, input), {
      status: 201,
    });
  },
  async getHost(workspaceId: string, hostId: string) {
    return ok(await runtimeHostService.getById(workspaceId, hostId));
  },

  // Executions
  async listExecutions(req: Request, workspaceId: string) {
    const { searchParams } = new URL(req.url);
    const status = executionStateEnum.parse(
      searchParams.get("status") ?? undefined,
    );
    return ok(await runtimeExecutionService.list(workspaceId, status));
  },
  async getExecution(workspaceId: string, executionId: string) {
    return ok(await runtimeExecutionService.getAggregate(workspaceId, executionId));
  },
  async dispatchCommand(req: Request, workspaceId: string) {
    const input = dispatchCommandSchema.parse(await req.json());
    return ok(await runtimeExecutionService.dispatchCommand(workspaceId, input), {
      status: 201,
    });
  },
  async cancelExecution(workspaceId: string, executionId: string) {
    return ok(await runtimeExecutionService.cancel(workspaceId, executionId));
  },
  async retryExecution(workspaceId: string, executionId: string) {
    return ok(await runtimeExecutionService.retry(workspaceId, executionId));
  },

  // Bridge: send an AI execution to a machine
  async dispatchAiExecution(
    req: Request,
    workspaceId: string,
    aiExecutionId: string,
  ) {
    const input = dispatchAiExecutionSchema.parse(await req.json());
    return ok(
      await runtimeBridgeService.dispatchAiExecution(
        workspaceId,
        aiExecutionId,
        input.hostId,
      ),
      { status: 201 },
    );
  },

  // Dashboard
  async dashboard(workspaceId: string) {
    return ok(await runtimeDashboardService.getOverview(workspaceId));
  },
};
