import { projectRepository, missionRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { companyBrain } from "@/server/brain/company-brain";
import type { ConfidenceResult } from "@/lib/confidence";

export interface ContinueRecall {
  resolved: boolean;
  sentence: string;
  message?: string; // when unresolved, why
  project?: { id: string; name: string; key: string };
  mission?: {
    id: string;
    title: string;
    status: string;
    health: string;
    progress: number;
    currentStage: string | null;
  };
  summary: string;
  lastDecisions: { title: string; outcome: string | null }[];
  recentFiles: { name: string; type: string }[];
  recentActivity: { title: string; createdAt: Date | string }[];
  nextSteps: string[];
  openTasks: number;
  confidence: ConfidenceResult | null;
}

function humanizeStage(stage: string | null) {
  if (!stage) return null;
  return stage
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * The product nucleus: **"Continue GOCO."**
 *
 * One sentence in. The system identifies the project, finds where it left off,
 * recalls the decisions / files / conversations that matter, summarizes it, and
 * proposes the next steps — recovering weeks of context in seconds. This is the
 * "aha moment", and the thing worth paying for.
 */
export const continueService = {
  async interpret(workspaceId: string, sentence: string): Promise<ContinueRecall> {
    await requireMembership(workspaceId);

    const project = await this.resolveProject(workspaceId, sentence);
    if (!project) {
      return {
        resolved: false,
        sentence,
        message:
          "I couldn't match that to a project yet. Name one (e.g. \"Continue GOCO\"), or launch a new mission.",
        summary: "",
        lastDecisions: [],
        recentFiles: [],
        recentActivity: [],
        nextSteps: [],
        openTasks: 0,
        confidence: null,
      };
    }

    const latest = await missionRepository.findLatestByProject(project.id);
    if (!latest) {
      return {
        resolved: true,
        sentence,
        project,
        summary: `${project.name} has no missions yet. Launch the first one to begin.`,
        lastDecisions: [],
        recentFiles: [],
        recentActivity: [],
        nextSteps: [`Launch the first mission for ${project.name}`],
        openTasks: 0,
        confidence: null,
      };
    }

    const mission = await missionRepository.findAggregate(latest.id);
    if (!mission) {
      return {
        resolved: true,
        sentence,
        project,
        summary: `${project.name}: could not load the latest mission.`,
        lastDecisions: [],
        recentFiles: [],
        recentActivity: [],
        nextSteps: [],
        openTasks: 0,
        confidence: null,
      };
    }

    const currentStage = mission.plan?.currentStage ?? null;
    const stageLabel = humanizeStage(currentStage);
    const openTasks = mission.tasks.filter((t) => t.status !== "DONE").length;
    const lastActivity = mission.activities[0];
    const confidence = companyBrain.assess(mission);

    const summary = [
      `${project.name}: "${mission.title}".`,
      `${mission.progress}% complete, ${mission.status.toLowerCase()}` +
        (stageLabel ? `, at the ${stageLabel} stage.` : "."),
      lastActivity ? `Last: ${lastActivity.title}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Propose the next steps from the plan + open work.
    const nextSteps: string[] = [];
    const waiting = mission.plan?.stages.find(
      (s) => s.status === "WAITING_APPROVAL",
    );
    const nextStage = mission.plan?.stages.find((s) =>
      ["PENDING", "ACTIVE"].includes(s.status),
    );
    if (waiting) nextSteps.push(`Approve: ${waiting.title}`);
    else if (nextStage) nextSteps.push(nextStage.title);
    const firstOpenTask = mission.tasks.find((t) => t.status !== "DONE");
    if (firstOpenTask) nextSteps.push(firstOpenTask.title);
    if (nextSteps.length === 0) nextSteps.push("Mark the mission complete");

    return {
      resolved: true,
      sentence,
      project,
      mission: {
        id: mission.id,
        title: mission.title,
        status: mission.status,
        health: mission.health,
        progress: mission.progress,
        currentStage,
      },
      summary,
      lastDecisions: mission.decisions
        .slice(0, 5)
        .map((d) => ({ title: d.title, outcome: d.outcome })),
      recentFiles: mission.artifacts
        .slice(0, 6)
        .map((a) => ({ name: a.name, type: a.type })),
      recentActivity: mission.activities
        .slice(0, 6)
        .map((a) => ({ title: a.title, createdAt: a.createdAt })),
      nextSteps,
      openTasks,
      confidence,
    };
  },

  /** Match a free sentence to a project (by key, name, or a name word). */
  async resolveProject(workspaceId: string, sentence: string) {
    const [projects] = await projectRepository.findManyByWorkspace(workspaceId, {
      take: 100,
    });
    const lower = sentence.toLowerCase();

    return (
      projects.find((p) => lower.includes(p.key.toLowerCase())) ??
      projects.find((p) => lower.includes(p.name.toLowerCase())) ??
      projects.find((p) =>
        p.name
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length > 2 && lower.includes(w)),
      ) ??
      null
    );
  },
};
