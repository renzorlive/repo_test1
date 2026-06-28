import type { Prisma } from "@prisma/client";
import {
  missionRepository,
  projectRepository,
  type MissionAggregate,
  type MissionListItem,
} from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionPolicy } from "@/server/policies/mission.policy";
import { missionEvents } from "@/server/events/mission-events";
import { ForbiddenError, NotFoundError } from "@/server/errors";
import type { Paginated, MissionHealth, MissionStatus } from "@/types";
import type { ListQuery } from "@/validations/common";
import type {
  CreateMissionInput,
  UpdateMissionInput,
  UpdateContextInput,
  CreateMilestoneInput,
} from "@/validations";

/**
 * Derive operational health from the lifecycle status, progress and deadline.
 * Pure function so it is trivially testable and side-effect free.
 */
function deriveHealth(args: {
  status: MissionStatus;
  progress: number;
  dueDate: Date | null;
}): MissionHealth {
  if (args.status === "BLOCKED") return "BLOCKED";
  if (args.status === "COMPLETED") return "ON_TRACK";
  if (args.status === "DRAFT" || args.status === "CANCELLED") return "UNKNOWN";

  const overdue =
    args.dueDate !== null &&
    args.dueDate.getTime() < Date.now() &&
    args.progress < 100;
  if (overdue) return args.progress >= 70 ? "AT_RISK" : "OFF_TRACK";
  return "ON_TRACK";
}

/**
 * MissionService — the orchestration core of the platform. Owns the mission
 * lifecycle, the time/cost envelope, progress rollups, working context and
 * milestones. Every state transition emits activity through MissionEvents.
 */
export const missionService = {
  async listByWorkspace(
    workspaceId: string,
    query: ListQuery,
  ): Promise<Paginated<MissionListItem>> {
    await requireMembership(workspaceId);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await missionRepository.findManyByWorkspace(
      workspaceId,
      { skip, take: query.pageSize, search: query.search },
    );
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.ceil(total / query.pageSize),
    };
  },

  async listByProject(workspaceId: string, projectId: string) {
    await this.assertProjectInWorkspace(workspaceId, projectId);
    return missionRepository.findManyByProject(projectId);
  },

  /** Full Mission Workspace aggregate. */
  async getAggregate(
    workspaceId: string,
    missionId: string,
  ): Promise<MissionAggregate> {
    await requireMissionAccess(workspaceId, missionId, "view");
    const aggregate = await missionRepository.findAggregate(missionId);
    if (!aggregate) throw new NotFoundError("Mission not found");
    return aggregate;
  },

  async create(workspaceId: string, input: CreateMissionInput) {
    const { user, membership } = await requireMembership(workspaceId);
    if (!missionPolicy.canEdit(membership.role)) {
      throw new ForbiddenError("Your role cannot create missions");
    }
    const project = await this.assertProjectInWorkspace(
      workspaceId,
      input.projectId,
    );

    const data: Prisma.MissionCreateInput = {
      title: input.title,
      summary: input.summary,
      objective: input.objective,
      outcome: input.outcome,
      status: input.status,
      health: input.health,
      priority: input.priority,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      estimatedCost: input.estimatedCost,
      startedAt: input.status === "ACTIVE" ? new Date() : undefined,
      project: { connect: { id: project.id } },
      workspace: { connect: { id: workspaceId } },
      owner: { connect: { id: input.ownerId ?? user.id } },
      // Seed an empty working context so the engine always has one to fill.
      context: { create: {} },
    };

    const mission = await missionRepository.create(data);

    await missionEvents.emit({
      missionId: mission.id,
      type: "MISSION_CREATED",
      title: `Mission "${mission.title}" created`,
      actor: { type: "USER", id: user.id, name: user.name ?? user.email },
      metadata: { status: mission.status, priority: mission.priority },
    });

    return mission;
  },

  async update(
    workspaceId: string,
    missionId: string,
    input: UpdateMissionInput,
  ) {
    const { mission, actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "edit",
    );

    const data: Prisma.MissionUpdateInput = {
      title: input.title,
      summary: input.summary,
      objective: input.objective,
      outcome: input.outcome,
      priority: input.priority,
      dueDate: input.dueDate,
      estimatedHours: input.estimatedHours,
      actualHours: input.actualHours,
      estimatedCost: input.estimatedCost,
      actualCost: input.actualCost,
      progress: input.progress,
    };
    if (input.ownerId) data.owner = { connect: { id: input.ownerId } };

    const statusChanged =
      input.status !== undefined && input.status !== mission.status;
    const healthChanged =
      input.health !== undefined && input.health !== mission.health;

    if (input.status !== undefined) data.status = input.status;
    if (input.health !== undefined) data.health = input.health;

    if (statusChanged) {
      if (input.status === "ACTIVE" && !mission.startedAt) {
        data.startedAt = new Date();
      }
      if (input.status === "COMPLETED") {
        data.completedAt = new Date();
        data.progress = 100;
        if (input.health === undefined) data.health = "ON_TRACK";
      } else if (mission.completedAt) {
        // Re-opening a completed mission clears the completion timestamp.
        data.completedAt = null;
      }
    }

    const updated = await missionRepository.update(missionId, data);

    // Emit the most specific events for the transition.
    if (statusChanged) {
      await missionEvents.emit({
        missionId,
        type:
          input.status === "COMPLETED"
            ? "MISSION_COMPLETED"
            : "MISSION_STATUS_CHANGED",
        title:
          input.status === "COMPLETED"
            ? `Mission completed`
            : `Status changed ${mission.status} → ${input.status}`,
        actor,
        metadata: { from: mission.status, to: input.status },
      });
    }
    if (healthChanged) {
      await missionEvents.emit({
        missionId,
        type: "MISSION_HEALTH_CHANGED",
        title: `Health changed ${mission.health} → ${input.health}`,
        actor,
        metadata: { from: mission.health, to: input.health },
      });
    }
    if (!statusChanged && !healthChanged) {
      await missionEvents.emit({
        missionId,
        type: "MISSION_UPDATED",
        title: `Mission details updated`,
        actor,
      });
    }

    return updated;
  },

  /**
   * Recompute progress from the task rollup and re-derive health. This is the
   * operational "refresh" action and the hook future task mutations call.
   */
  async recompute(workspaceId: string, missionId: string) {
    const { mission, actor } = await requireMissionAccess(
      workspaceId,
      missionId,
      "edit",
    );
    const { total, done } = await missionRepository.taskRollup(missionId);
    const progress =
      total > 0 ? Math.round((done / total) * 100) : mission.progress;
    const health = deriveHealth({
      status: mission.status,
      progress,
      dueDate: mission.dueDate,
    });

    const updated = await missionRepository.update(missionId, {
      progress,
      health,
    });

    await missionEvents.emit({
      missionId,
      type: "MISSION_UPDATED",
      title: `Progress recalculated to ${progress}%`,
      actor,
      metadata: { progress, tasksDone: done, tasksTotal: total, health },
    });

    return updated;
  },

  async remove(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "manage");
    return missionRepository.remove(missionId);
  },

  async updateContext(
    workspaceId: string,
    missionId: string,
    input: UpdateContextInput,
  ) {
    const { actor } = await requireMissionAccess(workspaceId, missionId, "edit");
    const context = await missionRepository.upsertContext(missionId, {
      background: input.background,
      constraints: input.constraints,
      assumptions: input.assumptions,
      references: input.references as Prisma.InputJsonValue | undefined,
    });
    await missionEvents.emit({
      missionId,
      type: "MISSION_UPDATED",
      title: `Mission context updated`,
      actor,
    });
    return context;
  },

  async addMilestone(
    workspaceId: string,
    missionId: string,
    input: CreateMilestoneInput,
  ) {
    const { actor } = await requireMissionAccess(workspaceId, missionId, "edit");
    const position = await missionRepository.nextMilestonePosition(missionId);
    const milestone = await missionRepository.createMilestone({
      mission: { connect: { id: missionId } },
      title: input.title,
      description: input.description,
      status: input.status,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      position,
    });
    await missionEvents.emit({
      missionId,
      type: "MISSION_UPDATED",
      title: `Milestone "${input.title}" added to timeline`,
      actor,
    });
    return milestone;
  },

  /** Guard: a project must exist within the workspace the user can access. */
  async assertProjectInWorkspace(workspaceId: string, projectId: string) {
    await requireMembership(workspaceId);
    const project = await projectRepository.findById(projectId);
    if (!project || project.workspaceId !== workspaceId) {
      throw new NotFoundError("Project not found");
    }
    return project;
  },
};
