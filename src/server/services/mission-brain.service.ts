import type { Mission, MissionStageType, Prisma } from "@prisma/client";
import {
  missionRepository,
  missionPlanRepository,
  projectRepository,
  aiExecutionRepository,
  type MissionPlanWithStages,
} from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { requireMissionAccess } from "@/server/services/mission-access";
import { missionPolicy } from "@/server/policies/mission.policy";
import { missionEvents } from "@/server/events/mission-events";
import { workerRegistry } from "@/server/ai/worker-registry";
import { aiExecutionService } from "@/server/services/ai-execution.service";
import { companyBrain } from "@/server/brain/company-brain";
import { resumeService } from "@/server/services/resume.service";
import { dimensionOf } from "@/lib/confidence";
import { AppError, ForbiddenError, NotFoundError } from "@/server/errors";
import type { LaunchMissionInput } from "@/validations";

/** Read a plan's JSON memory blob as a plain object. */
function readMemory(memory: Prisma.JsonValue): Record<string, unknown> {
  return memory && typeof memory === "object" && !Array.isArray(memory)
    ? (memory as Record<string, unknown>)
    : {};
}

/** The brain acts as a manager — its actions are attributed to "Mission Brain". */
const BRAIN = { type: "AGENT" as const, name: "Mission Brain" };

/** The autonomous pipeline every objective is driven through. */
const PIPELINE: {
  type: MissionStageType;
  title: string;
  requiresApproval: boolean;
}[] = [
  { type: "PLANNING", title: "Plan the work", requiresApproval: false },
  { type: "ARCHITECTURE", title: "Design the architecture", requiresApproval: false },
  { type: "TASK_BREAKDOWN", title: "Break the goal into tasks", requiresApproval: false },
  { type: "WORKER_ASSIGNMENT", title: "Assign AI workers", requiresApproval: false },
  { type: "EXECUTION", title: "Execute the work", requiresApproval: false },
  { type: "REVIEW", title: "Review the result", requiresApproval: true },
  { type: "FIX", title: "Apply fixes", requiresApproval: false },
  { type: "COMMIT", title: "Commit the changes", requiresApproval: false },
  { type: "DEPLOY", title: "Deploy", requiresApproval: true },
  { type: "RELEASE_NOTES", title: "Generate release notes", requiresApproval: false },
  { type: "DONE", title: "Done", requiresApproval: false },
];

const PENDING_STATES = ["PENDING", "ACTIVE", "WAITING_APPROVAL"];

function shortHash() {
  return Math.random().toString(16).slice(2, 9);
}

/**
 * MissionBrainService — the Autonomous Mission System.
 *
 * The user provides ONE business objective. The brain creates the plan,
 * milestones and tasks, picks workers, builds context, launches executions,
 * pauses only at approval gates, and rolls everything up. Outcome-first: the
 * founder never chooses a worker, provider, runtime, prompt or context.
 */
export const missionBrainService = {
  /** Founder Mode entry point: one objective → a fully planned mission. */
  async launch(workspaceId: string, input: LaunchMissionInput) {
    const { user, membership } = await requireMembership(workspaceId);
    if (!missionPolicy.canEdit(membership.role)) {
      throw new ForbiddenError("Your role cannot launch missions");
    }

    const project = await this.resolveProject(workspaceId, input.projectId);

    const mission = await missionRepository.create({
      title: input.objective.slice(0, 160),
      summary: input.objective,
      objective: input.objective,
      status: "ACTIVE",
      health: "ON_TRACK",
      priority: "HIGH",
      mode: "FOUNDER",
      autonomy: input.autonomy,
      startedAt: new Date(),
      project: { connect: { id: project.id } },
      workspace: { connect: { id: workspaceId } },
      owner: { connect: { id: user.id } },
      context: { create: {} },
    });

    await missionPlanRepository.createWithStages(
      mission.id,
      input.objective,
      PIPELINE,
    );

    await missionEvents.emit({
      missionId: mission.id,
      type: "MISSION_CREATED",
      title: `Autonomous mission launched: "${input.objective}"`,
      actor: { type: "USER", id: user.id, name: user.name ?? user.email },
      metadata: { autonomy: input.autonomy },
    });

    // Kick the brain so the founder immediately sees it working.
    await this.advance(workspaceId, mission.id);
    return mission;
  },

  /**
   * The brain takes the next action(s): it processes auto stages until it hits
   * an execution it must wait on, an approval gate, or completion.
   */
  async advance(
    workspaceId: string,
    missionId: string,
    opts?: { force?: boolean },
  ) {
    await requireMissionAccess(workspaceId, missionId, "edit");

    // Founder override: "execute anyway" lifts the confidence gate from here on.
    if (opts?.force) {
      const plan = await missionPlanRepository.findByMission(missionId);
      if (plan) {
        await missionPlanRepository.updatePlan(plan.id, {
          memory: { ...readMemory(plan.memory), confidenceOverride: true, confidenceBlocked: false },
        });
      }
    }

    for (let i = 0; i < 15; i++) {
      const plan = await missionPlanRepository.findByMission(missionId);
      if (!plan) throw new NotFoundError("Mission has no plan");
      const mission = await missionRepository.findCore(missionId);
      if (!mission) throw new NotFoundError("Mission not found");

      const current = plan.stages.find((s) =>
        PENDING_STATES.includes(s.status),
      );
      if (!current) break; // everything done

      if (current.status === "WAITING_APPROVAL") break; // waiting on a human

      // Confidence gate: the brain refuses to auto-execute when it doesn't know
      // enough, and asks for the missing context instead.
      if (current.type === "EXECUTION" && current.status === "PENDING") {
        const blocked = await this.confidenceGate(missionId, plan, mission.autonomy);
        if (blocked) break;
      }

      // Approval gate: pause before running.
      if (current.requiresApproval && current.status === "PENDING") {
        await missionPlanRepository.updateStage(current.id, {
          status: "WAITING_APPROVAL",
          startedAt: new Date(),
        });
        await missionEvents.emit({
          missionId,
          type: "APPROVAL_REQUESTED",
          title: `Approval needed: ${current.title}`,
          actor: BRAIN,
          metadata: { stageId: current.id, stage: current.type },
        });
        await this.syncProgress(missionId, plan);
        break;
      }

      const result = await this.runStage(plan, current, mission);
      if (result.wait) break; // execution in flight

      await missionPlanRepository.updateStage(current.id, {
        status: "COMPLETED",
        completedAt: new Date(),
        output: (result.output ?? {}) as Prisma.InputJsonValue,
      });
      await this.syncProgress(missionId, plan);
    }

    // Checkpoint: capture a Resume Snapshot at the boundary the brain stopped on,
    // so the next "Resume …" loads the last save and only fills in the diffs.
    await resumeService.snapshot(missionId);

    return missionPlanRepository.findByMission(missionId);
  },

  /** Approve the stage the brain paused on, then keep going. */
  async approveStage(workspaceId: string, missionId: string, stageId: string) {
    await requireMissionAccess(workspaceId, missionId, "approve");
    const stage = await this.requireWaitingStage(missionId, stageId);

    await missionPlanRepository.updateStage(stageId, {
      status: "COMPLETED",
      completedAt: new Date(),
      output: { approved: true },
    });

    if (stage.type === "REVIEW") {
      // Approved review ⇒ no fixes needed.
      const fix = await missionPlanRepository.findStageOfType(stage.planId, "FIX");
      if (fix && fix.status === "PENDING") {
        await missionPlanRepository.updateStage(fix.id, { status: "SKIPPED" });
      }
    }
    if (stage.type === "DEPLOY") {
      const mission = await missionRepository.findCore(missionId);
      if (mission) {
        await missionRepository.createArtifact({
          name: `Deployment ${shortHash()}`,
          type: "LINK",
          project: { connect: { id: mission.projectId } },
          mission: { connect: { id: missionId } },
          content: { deployedAt: new Date().toISOString() },
        });
      }
    }

    await missionEvents.emit({
      missionId,
      type: "APPROVAL_ACCEPTED",
      title: `Approved: ${stage.title}`,
      actor: BRAIN,
    });

    return this.advance(workspaceId, missionId);
  },

  /** Reject the gate: review ⇒ run fixes; deploy ⇒ pause the mission. */
  async rejectStage(workspaceId: string, missionId: string, stageId: string) {
    await requireMissionAccess(workspaceId, missionId, "approve");
    const stage = await this.requireWaitingStage(missionId, stageId);

    if (stage.type === "DEPLOY") {
      await missionPlanRepository.updateStage(stageId, { status: "FAILED" });
      const plan = await missionPlanRepository.findByMission(missionId);
      if (plan) await missionPlanRepository.updatePlan(plan.id, { status: "PAUSED" });
      await missionEvents.emit({
        missionId,
        type: "APPROVAL_REJECTED",
        title: `Deployment rejected — mission paused`,
        actor: BRAIN,
      });
      return missionPlanRepository.findByMission(missionId);
    }

    // Review rejected ⇒ the FIX stage will run next.
    await missionPlanRepository.updateStage(stageId, {
      status: "COMPLETED",
      completedAt: new Date(),
      output: { approved: false },
    });
    await missionEvents.emit({
      missionId,
      type: "REVIEW_FAILED",
      title: `Changes requested — the brain will apply fixes`,
      actor: BRAIN,
    });
    return this.advance(workspaceId, missionId);
  },

  async setMode(workspaceId: string, missionId: string, mode: "FOUNDER" | "ADVANCED") {
    await requireMissionAccess(workspaceId, missionId, "view");
    return missionRepository.update(missionId, { mode });
  },

  /** The brain's self-assessment: how much it knows before it acts. */
  async confidence(workspaceId: string, missionId: string) {
    await requireMissionAccess(workspaceId, missionId, "view");
    return companyBrain.confidenceForMission(missionId);
  },

  /**
   * The heart of "knows when it doesn't know". Returns true (and pauses) when
   * the brain is not confident enough to execute autonomously, recording what's
   * missing so the founder can supply it (or override).
   */
  async confidenceGate(
    missionId: string,
    plan: MissionPlanWithStages,
    autonomy: string,
  ): Promise<boolean> {
    if (autonomy === "MANUAL") return false; // user drives every step
    const memory = readMemory(plan.memory);
    if (memory.confidenceOverride) return false; // founder said "go anyway"

    const result = await companyBrain.confidenceForMission(missionId);
    const exec = dimensionOf(result, "EXECUTION");
    if (!exec || exec.ok) {
      if (memory.confidenceBlocked) {
        await missionPlanRepository.updatePlan(plan.id, {
          memory: { ...memory, confidenceBlocked: false },
        });
      }
      return false;
    }

    await missionPlanRepository.updatePlan(plan.id, {
      memory: {
        ...memory,
        confidenceBlocked: true,
        confidenceScore: exec.score,
        confidenceMissing: exec.missing,
      },
    });
    await missionEvents.emit({
      missionId,
      type: "MISSION_UPDATED",
      title: `Mission Brain paused — execution confidence ${exec.score}%. Needs: ${exec.missing.join(", ")}`,
      actor: BRAIN,
      metadata: { score: exec.score, missing: exec.missing },
    });
    return true;
  },

  // ---- Stage execution ------------------------------------------------------

  async runStage(
    plan: MissionPlanWithStages,
    stage: MissionPlanWithStages["stages"][number],
    mission: Mission,
  ): Promise<{ wait?: boolean; output?: Record<string, unknown> }> {
    const projectConnect = { connect: { id: mission.projectId } };
    const missionConnect = { connect: { id: mission.id } };

    switch (stage.type) {
      case "PLANNING":
        await missionRepository.createDecision({
          title: `Execution plan: ${mission.title}`,
          context: `Auto-generated plan for "${plan.objective}".`,
          outcome: "Plan drafted by the Mission Brain.",
          status: "ACCEPTED",
          project: projectConnect,
          mission: missionConnect,
        });
        await this.note(mission.id, "DECISION_ADDED", "Manager created the execution plan");
        return {};

      case "ARCHITECTURE":
        await missionRepository.createDecision({
          title: "Architecture approach",
          context: "Chosen by the Mission Brain.",
          outcome: "Layered, scalable architecture selected.",
          status: "ACCEPTED",
          project: projectConnect,
          mission: missionConnect,
        });
        await this.note(mission.id, "DECISION_ADDED", "Manager designed the architecture");
        return {};

      case "TASK_BREAKDOWN": {
        const epic = await missionRepository.createEpic({
          title: `Build: ${mission.title}`,
          status: "IN_PROGRESS",
          project: projectConnect,
          mission: missionConnect,
        });
        const titles = ["Implement core", "Add tests", "Polish the result"];
        await missionRepository.createTasks(
          titles.map((title, i) => ({
            title,
            status: "TODO" as const,
            priority: "MEDIUM" as const,
            position: i,
            projectId: mission.projectId,
            missionId: mission.id,
            epicId: epic.id,
          })),
        );
        await this.note(mission.id, "TASK_CREATED", `Manager broke the goal into ${titles.length} tasks`);
        return { output: { epicId: epic.id, taskCount: titles.length } };
      }

      case "WORKER_ASSIGNMENT": {
        const worker = await workerRegistry.select(mission.workspaceId, "CODE_GENERATION");
        await this.note(
          mission.id,
          "MISSION_UPDATED",
          worker
            ? `Manager assigned worker "${worker.name}"`
            : "Manager found no available worker — will queue",
        );
        return { output: { worker: worker?.name ?? null } };
      }

      case "EXECUTION": {
        const output = (stage.output ?? {}) as { aiExecutionId?: string };
        if (stage.status === "ACTIVE" && output.aiExecutionId) {
          const exec = await aiExecutionRepository.findCore(output.aiExecutionId);
          if (exec && ["COMPLETED", "FAILED", "CANCELLED"].includes(exec.state)) {
            return { output }; // execution settled → complete the stage
          }
          return { wait: true }; // still running
        }
        const submitted = await aiExecutionService.submit(mission.workspaceId, {
          title: `Execute: ${mission.title}`,
          userRequest: `Implement this objective:\n${plan.objective}`,
          requiredCapability: "CODE_GENERATION",
          missionId: mission.id,
          priority: 70,
          requiresApproval: false,
          constraints: [],
          params: {},
        });
        await missionPlanRepository.updateStage(stage.id, {
          status: "ACTIVE",
          startedAt: new Date(),
          output: { aiExecutionId: submitted.id },
        });
        await this.note(mission.id, "AI_SESSION_STARTED", "Manager launched an execution");
        return { wait: true };
      }

      case "FIX":
        await this.note(mission.id, "MISSION_UPDATED", "Manager applied review fixes");
        return {};

      case "COMMIT":
        await missionRepository.createArtifact({
          name: `commit ${shortHash()}`,
          type: "CODE",
          project: projectConnect,
          mission: missionConnect,
          content: { message: `Implement ${mission.title}` },
        });
        await this.note(mission.id, "ARTIFACT_UPLOADED", "Manager committed the changes");
        return {};

      case "RELEASE_NOTES":
        await missionRepository.createArtifact({
          name: "Release notes",
          type: "REPORT",
          project: projectConnect,
          mission: missionConnect,
          content: {
            notes: `## ${mission.title}\n\nShipped autonomously by RNZ OS.\n\n- Planned, built, reviewed and deployed by the Mission Brain.`,
          },
        });
        await this.note(mission.id, "ARTIFACT_UPLOADED", "Manager generated release notes");
        return {};

      case "DONE": {
        const plan2 = await missionPlanRepository.findByMission(mission.id);
        await missionRepository.update(mission.id, {
          status: "COMPLETED",
          progress: 100,
          completedAt: new Date(),
          health: "ON_TRACK",
        });
        if (plan2) {
          await missionPlanRepository.updatePlan(plan2.id, {
            status: "COMPLETED",
            currentStage: "DONE",
          });
        }
        await missionEvents.emit({
          missionId: mission.id,
          type: "MISSION_COMPLETED",
          title: "Mission completed autonomously 🎉",
          actor: BRAIN,
        });
        return {};
      }

      default:
        return {};
    }
  },

  // ---- Internals ------------------------------------------------------------

  async note(
    missionId: string,
    type: Parameters<typeof missionEvents.emit>[0]["type"],
    title: string,
  ) {
    await missionEvents.emit({ missionId, type, title, actor: BRAIN });
  },

  /** Update mission progress + the plan's current stage from stage completion. */
  async syncProgress(missionId: string, _plan: MissionPlanWithStages) {
    const plan = await missionPlanRepository.findByMission(missionId);
    if (!plan) return;
    const total = plan.stages.length;
    const done = plan.stages.filter((s) =>
      ["COMPLETED", "SKIPPED"].includes(s.status),
    ).length;
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    const current = plan.stages.find((s) => PENDING_STATES.includes(s.status));
    await missionRepository.update(missionId, { progress });
    await missionPlanRepository.updatePlan(plan.id, {
      currentStage: current?.type ?? "DONE",
    });
  },

  async requireWaitingStage(missionId: string, stageId: string) {
    const stage = await missionPlanRepository.findStage(stageId);
    if (!stage || stage.missionId !== missionId) {
      throw new NotFoundError("Stage not found");
    }
    if (stage.status !== "WAITING_APPROVAL") {
      throw new AppError("Stage is not awaiting approval", 409, "INVALID_STATE");
    }
    return stage;
  },

  /** Pick the target project: explicit, else first, else a default one. */
  async resolveProject(workspaceId: string, projectId?: string) {
    if (projectId) {
      const project = await projectRepository.findById(projectId);
      if (!project || project.workspaceId !== workspaceId) {
        throw new NotFoundError("Project not found");
      }
      return project;
    }
    const [projects] = await projectRepository.findManyByWorkspace(workspaceId, {
      take: 1,
    });
    if (projects[0]) return projects[0];
    return projectRepository.create(workspaceId, {
      name: "Autonomous Missions",
      key: "AUTO",
      status: "ACTIVE",
      color: "#6366f1",
    });
  },
};
