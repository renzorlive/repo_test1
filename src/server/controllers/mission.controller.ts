import { ok } from "@/server/http";
import {
  missionService,
  missionActivityService,
  missionApprovalService,
  missionNoteService,
  missionDependencyService,
  missionMetricService,
  aiSessionService,
  executionPlannerService,
} from "@/server/services";
import {
  createMissionSchema,
  updateMissionSchema,
  createApprovalSchema,
  decideApprovalSchema,
  createNoteSchema,
  createDependencySchema,
  recordMetricSchema,
  createAiSessionSchema,
  updateAiSessionSchema,
  updateContextSchema,
  createMilestoneSchema,
  activityQuerySchema,
  previewExecutionSchema,
} from "@/validations";
import { listQuerySchema } from "@/validations/common";

/**
 * MissionController — translates HTTP requests into MissionService calls and
 * wraps results in the standard response envelope. Route handlers are thin
 * delegations to these methods; all parsing + status mapping lives here so the
 * many mission sub-resources stay consistent and DRY.
 */
export const missionController = {
  // ---- Mission core ---------------------------------------------------------

  async list(req: Request, workspaceId: string) {
    const { searchParams } = new URL(req.url);
    const query = listQuerySchema.parse(Object.fromEntries(searchParams));
    return ok(await missionService.listByWorkspace(workspaceId, query));
  },

  async create(req: Request, workspaceId: string) {
    const input = createMissionSchema.parse(await req.json());
    return ok(await missionService.create(workspaceId, input), { status: 201 });
  },

  async get(workspaceId: string, missionId: string) {
    return ok(await missionService.getAggregate(workspaceId, missionId));
  },

  async update(req: Request, workspaceId: string, missionId: string) {
    const input = updateMissionSchema.parse(await req.json());
    return ok(await missionService.update(workspaceId, missionId, input));
  },

  async remove(workspaceId: string, missionId: string) {
    await missionService.remove(workspaceId, missionId);
    return ok({ id: missionId });
  },

  async recompute(workspaceId: string, missionId: string) {
    return ok(await missionService.recompute(workspaceId, missionId));
  },

  async updateContext(req: Request, workspaceId: string, missionId: string) {
    const input = updateContextSchema.parse(await req.json());
    return ok(await missionService.updateContext(workspaceId, missionId, input));
  },

  async addMilestone(req: Request, workspaceId: string, missionId: string) {
    const input = createMilestoneSchema.parse(await req.json());
    return ok(await missionService.addMilestone(workspaceId, missionId, input), {
      status: 201,
    });
  },

  // ---- Execution wizard -----------------------------------------------------

  async previewExecution(req: Request, workspaceId: string, missionId: string) {
    const input = previewExecutionSchema.parse(await req.json());
    return ok(
      await executionPlannerService.preview(workspaceId, missionId, input),
    );
  },

  // ---- Activity -------------------------------------------------------------

  async listActivity(req: Request, workspaceId: string, missionId: string) {
    const { searchParams } = new URL(req.url);
    const query = activityQuerySchema.parse(Object.fromEntries(searchParams));
    return ok(
      await missionActivityService.listForMission(workspaceId, missionId, query),
    );
  },

  // ---- Approvals ------------------------------------------------------------

  async listApprovals(workspaceId: string, missionId: string) {
    return ok(await missionApprovalService.list(workspaceId, missionId));
  },

  async requestApproval(req: Request, workspaceId: string, missionId: string) {
    const input = createApprovalSchema.parse(await req.json());
    return ok(
      await missionApprovalService.request(workspaceId, missionId, input),
      { status: 201 },
    );
  },

  async decideApproval(
    req: Request,
    workspaceId: string,
    missionId: string,
    approvalId: string,
  ) {
    const input = decideApprovalSchema.parse(await req.json());
    return ok(
      await missionApprovalService.decide(
        workspaceId,
        missionId,
        approvalId,
        input,
      ),
    );
  },

  // ---- Notes ----------------------------------------------------------------

  async listNotes(workspaceId: string, missionId: string) {
    return ok(await missionNoteService.list(workspaceId, missionId));
  },

  async createNote(req: Request, workspaceId: string, missionId: string) {
    const input = createNoteSchema.parse(await req.json());
    return ok(await missionNoteService.create(workspaceId, missionId, input), {
      status: 201,
    });
  },

  // ---- Dependencies ---------------------------------------------------------

  async createDependency(req: Request, workspaceId: string, missionId: string) {
    const input = createDependencySchema.parse(await req.json());
    return ok(
      await missionDependencyService.create(workspaceId, missionId, input),
      { status: 201 },
    );
  },

  // ---- Metrics --------------------------------------------------------------

  async listMetrics(workspaceId: string, missionId: string) {
    return ok(await missionMetricService.list(workspaceId, missionId));
  },

  async recordMetric(req: Request, workspaceId: string, missionId: string) {
    const input = recordMetricSchema.parse(await req.json());
    return ok(await missionMetricService.record(workspaceId, missionId, input), {
      status: 201,
    });
  },

  // ---- AI Sessions ----------------------------------------------------------

  async listAiSessions(workspaceId: string, missionId: string) {
    return ok(await aiSessionService.list(workspaceId, missionId));
  },

  async startAiSession(req: Request, workspaceId: string, missionId: string) {
    const input = createAiSessionSchema.parse(await req.json());
    return ok(await aiSessionService.start(workspaceId, missionId, input), {
      status: 201,
    });
  },

  async updateAiSession(
    req: Request,
    workspaceId: string,
    missionId: string,
    sessionId: string,
  ) {
    const input = updateAiSessionSchema.parse(await req.json());
    return ok(
      await aiSessionService.update(workspaceId, missionId, sessionId, input),
    );
  },
};
