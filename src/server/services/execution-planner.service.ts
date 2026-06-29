import {
  missionRepository,
  aiWorkerRepository,
} from "@/server/repositories";
import { requireMissionAccess } from "@/server/services/mission-access";
import { contextBuilder } from "@/server/ai/context-builder";
import { gatherMissionContextSources } from "@/server/ai/context-sources";
import { promptBuilder } from "@/server/ai/prompt-builder";
import { NotFoundError } from "@/server/errors";
import type { PreviewExecutionInput } from "@/validations";

export interface MissionSuggestions {
  nextTask: string;
  nextWorker: string;
  risks: string[];
  missingContext: string[];
  improvements: string[];
}

/**
 * ExecutionPlannerService — read-only intelligence for the Execution Workspace.
 * Powers the wizard's context/prompt preview (steps 4–5) and the proactive AI
 * Suggestions panel. Heuristic only: no model is called, so it is instant and
 * free, and slots in behind the same provider-agnostic builders the engine uses.
 */
export const executionPlannerService = {
  /** Assemble the context package + versioned prompt without persisting. */
  async preview(
    workspaceId: string,
    missionId: string,
    input: PreviewExecutionInput,
  ) {
    await requireMissionAccess(workspaceId, missionId, "view");
    const sources = await gatherMissionContextSources(workspaceId, missionId);
    const context = contextBuilder.build(sources);
    const prompt = promptBuilder.build({
      version: 1,
      systemInstructions: input.systemInstructions,
      userRequest: input.goal,
      constraints: input.constraints,
      outputFormat: input.outputFormat,
      context,
    });
    return { context, prompt };
  },

  /** Proactive suggestions for a mission (next task/worker, risks, gaps). */
  async suggestions(
    workspaceId: string,
    missionId: string,
  ): Promise<MissionSuggestions> {
    await requireMissionAccess(workspaceId, missionId, "view");
    const mission = await missionRepository.findAggregate(missionId);
    if (!mission) throw new NotFoundError("Mission not found");

    const workers = await aiWorkerRepository.listByWorkspace(workspaceId);

    // Next task: the first open task, else a prompt to plan.
    const openTask = mission.tasks.find(
      (t) => t.status !== "DONE" && t.status !== "BLOCKED",
    );
    const nextTask = openTask
      ? openTask.title
      : mission.tasks.length === 0
        ? "Break this mission into tasks to begin execution"
        : "Unblock a task to keep momentum";

    // Next worker: highest-priority healthy worker.
    const healthy = workers
      .filter((w) => w.status !== "DISABLED" && w.health !== "UNHEALTHY")
      .sort((a, b) => b.priority - a.priority);
    const nextWorker = healthy[0]
      ? `${healthy[0].name} (${healthy[0].role})`
      : "Register an AI worker to start executing";

    const risks: string[] = [];
    if (
      mission.dueDate &&
      new Date(mission.dueDate).getTime() < Date.now() &&
      mission.status !== "COMPLETED"
    ) {
      risks.push("Mission is past its due date");
    }
    if (mission.status === "BLOCKED") risks.push("Mission is currently blocked");
    const blockingDeps = mission.dependencies.filter(
      (d) => d.dependsOn.status !== "COMPLETED",
    );
    if (blockingDeps.length > 0) {
      risks.push(`${blockingDeps.length} upstream dependency not yet complete`);
    }
    if (workers.length === 0) risks.push("No AI workers registered");
    if (mission.tasks.filter((t) => t.status === "BLOCKED").length > 0) {
      risks.push("One or more tasks are blocked");
    }

    const missingContext: string[] = [];
    if (!mission.objective) missingContext.push("No objective defined");
    if (!mission.context?.background) missingContext.push("No background context");
    if (mission.decisions.length === 0) missingContext.push("No decisions recorded");
    const constraintCount = Array.isArray(mission.context?.constraints)
      ? (mission.context?.constraints as unknown[]).length
      : 0;
    if (constraintCount === 0) missingContext.push("No constraints specified");

    const improvements: string[] = [];
    if (mission.tasks.length > 0 && mission.epics.length === 0) {
      improvements.push("Group tasks into epics for clearer structure");
    }
    if (mission.milestones.length === 0) {
      improvements.push("Add milestones to track the execution journey");
    }
    if (!mission.outcome) {
      improvements.push("Define the desired outcome / definition of done");
    }
    if (mission.aiSessions.length === 0 && mission.tasks.length > 0) {
      improvements.push("Run an AI worker to accelerate the open tasks");
    }

    return { nextTask, nextWorker, risks, missingContext, improvements };
  },
};
