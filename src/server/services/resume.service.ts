import type { Prisma } from "@prisma/client";
import { projectRepository, missionRepository } from "@/server/repositories";
import type { MissionAggregate } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { companyBrain } from "@/server/brain/company-brain";
import type { ConfidenceResult } from "@/lib/confidence";

/**
 * A Resume Package is not "context" — it is a structured re-entry object. It is
 * the answer to "help me re-enter my work state instantly": what the objective
 * is, what you were doing, what blocks you, the decisions that got you here, and
 * the single next action — plus how long it should take to be productive again.
 */
export interface ResumePackage {
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

  /** When this work was last touched. */
  lastActive: Date | string | null;
  /** The objective the work exists to achieve. */
  currentObjective: string | null;
  /** Concrete things in flight when you stopped. */
  youWereDoing: string[];
  /** What stands between you and progress. */
  blockedBy: string[];
  /** The decisions that shaped where you are. */
  recentDecisions: { title: string; outcome: string | null }[];
  /** Files worth opening first. */
  relevantFiles: { name: string; type: string }[];
  /** The single best next action. */
  recommendedNextAction: string;
  /** Confidence v2 — knowledge / planning / execution / deployment. */
  confidence: ConfidenceResult | null;
  /** Rough time-to-productive, in minutes. */
  estimatedMinutesToResume: number;
  /** A one-paragraph human recap. */
  summary: string;
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
 * Estimate how long it takes to get productive again. The more the package
 * already hands you (objective, decisions, a clear next action) and the smaller
 * the surface (few open tasks, not blocked), the faster the re-entry.
 */
function estimateMinutes(args: {
  openTasks: number;
  blocked: number;
  decisions: number;
  hasObjective: boolean;
}) {
  let minutes = 2; // a clean checkpoint resumes almost instantly
  minutes += Math.min(args.openTasks, 8) * 1.5;
  minutes += args.blocked * 3;
  if (!args.hasObjective) minutes += 5;
  if (args.decisions === 0) minutes += 3;
  return Math.max(1, Math.round(minutes));
}

/**
 * The Resume Engine.
 *
 * "Resume GOCO." "Resume yesterday." "Resume the SEO campaign." One sentence in,
 * a Resume Package out. The same engine also writes Resume Snapshots —
 * checkpoints, like a game save — at each important execution, so the next
 * resume loads the last checkpoint and only fills in the diffs.
 */
export const resumeService = {
  /** Build a Resume Package from one sentence. */
  async resume(workspaceId: string, sentence: string): Promise<ResumePackage> {
    await requireMembership(workspaceId);

    const project = await this.resolveProject(workspaceId, sentence);
    if (!project) {
      return unresolved(
        sentence,
        'I couldn\'t match that to a project yet. Name one ("Resume GOCO"), say "Resume yesterday", or launch a new mission.',
      );
    }

    const latest = await missionRepository.findLatestByProject(project.id);
    if (!latest) {
      return {
        ...emptyPackage(sentence),
        resolved: true,
        project,
        summary: `${project.name} has no work yet. Launch the first mission to begin.`,
        recommendedNextAction: `Launch the first mission for ${project.name}`,
        estimatedMinutesToResume: 1,
      };
    }

    const mission = await missionRepository.findAggregate(latest.id);
    if (!mission) {
      return {
        ...emptyPackage(sentence),
        resolved: true,
        project,
        summary: `${project.name}: could not load the latest mission.`,
        recommendedNextAction: "Open Mission Control",
      };
    }

    return this.packageFor(project, mission);
  },

  /** Assemble the Resume Package for a concrete mission. */
  async packageFor(
    project: { id: string; name: string; key: string },
    mission: MissionAggregate,
    sentence = `Resume ${project.key}`,
  ): Promise<ResumePackage> {
    const currentStage = mission.plan?.currentStage ?? null;
    const stageLabel = humanizeStage(currentStage);
    const openTasks = mission.tasks.filter((t) => t.status !== "DONE");
    const lastActivity = mission.activities[0];

    // Prefer a stored snapshot's framing if one exists; live data fills the rest.
    const snapshot = await missionRepository.latestSnapshot(mission.id);

    const confidence = await companyBrain.confidenceForMission(mission.id);

    // "You were doing" — work in flight: the active stage + open tasks.
    const youWereDoing: string[] = [];
    const active = mission.plan?.stages.find((s) => s.status === "ACTIVE");
    if (active) youWereDoing.push(active.title);
    for (const t of openTasks.slice(0, 4)) youWereDoing.push(t.title);
    if (youWereDoing.length === 0 && stageLabel) {
      youWereDoing.push(`At the ${stageLabel} stage`);
    }

    // "Blocked by" — approval gates + the brain's own confidence pause.
    const blockedBy: string[] = [];
    const waiting = mission.plan?.stages.find(
      (s) => s.status === "WAITING_APPROVAL",
    );
    if (waiting) blockedBy.push(`Waiting on your approval: ${waiting.title}`);
    const memory = readMemory(mission.plan?.memory);
    if (memory.confidenceBlocked && Array.isArray(memory.confidenceMissing)) {
      blockedBy.push(
        `Brain needs more context: ${(memory.confidenceMissing as string[]).join(", ")}`,
      );
    }
    if (!confidence.dimensions.find((d) => d.key === "DEPLOYMENT")?.ok) {
      const dep = confidence.dimensions.find((d) => d.key === "DEPLOYMENT");
      if (dep && currentStage === "DEPLOY") {
        blockedBy.push(`Can't deploy yet: ${dep.missing.join(", ")}`);
      }
    }

    // The single best next action.
    const nextStage = mission.plan?.stages.find((s) =>
      ["PENDING", "ACTIVE"].includes(s.status),
    );
    let recommendedNextAction: string;
    if (waiting) recommendedNextAction = `Approve: ${waiting.title}`;
    else if (active) recommendedNextAction = `Wait for: ${active.title}`;
    else if (nextStage) recommendedNextAction = nextStage.title;
    else if (openTasks[0]) recommendedNextAction = openTasks[0].title;
    else recommendedNextAction = "Mark the mission complete";

    const summary = [
      `${project.name}: "${mission.title}".`,
      `${mission.progress}% complete, ${mission.status.toLowerCase()}` +
        (stageLabel ? `, at the ${stageLabel} stage.` : "."),
      lastActivity ? `Last: ${lastActivity.title}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

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
      lastActive: snapshot?.createdAt ?? mission.updatedAt,
      currentObjective: mission.objective ?? mission.summary ?? mission.title,
      youWereDoing,
      blockedBy,
      recentDecisions: mission.decisions
        .slice(0, 5)
        .map((d) => ({ title: d.title, outcome: d.outcome })),
      relevantFiles: mission.artifacts
        .slice(0, 6)
        .map((a) => ({ name: a.name, type: a.type })),
      recommendedNextAction,
      confidence,
      estimatedMinutesToResume: estimateMinutes({
        openTasks: openTasks.length,
        blocked: blockedBy.length,
        decisions: mission.decisions.length,
        hasObjective: Boolean(mission.objective),
      }),
      summary,
    };
  },

  /**
   * Write a Resume Snapshot — a checkpoint, like a game save. Captured at each
   * important execution so the next resume loads the last checkpoint and only
   * fills in the diffs. Never throws into the caller's pipeline.
   */
  async snapshot(missionId: string) {
    try {
      const mission = await missionRepository.findAggregate(missionId);
      if (!mission) return null;
      const project = {
        id: mission.project.id,
        name: mission.project.name,
        key: mission.project.key,
      };
      const pkg = await this.packageFor(project, mission);
      return await missionRepository.createSnapshot({
        workspaceId: mission.workspaceId,
        projectId: mission.projectId,
        summary: pkg.summary,
        data: pkg as unknown as Prisma.InputJsonValue,
        mission: { connect: { id: missionId } },
      });
    } catch {
      return null; // a checkpoint failure must never break execution
    }
  },

  /**
   * Match a free sentence to a project — by key, name, or a name word. Falls
   * back to the most recently touched mission's project, so "Resume yesterday"
   * (or just "Resume") picks up wherever you actually left off.
   */
  async resolveProject(workspaceId: string, sentence: string) {
    const [projects] = await projectRepository.findManyByWorkspace(workspaceId, {
      take: 100,
    });
    const lower = sentence.toLowerCase();

    const matched =
      projects.find((p) => lower.includes(p.key.toLowerCase())) ??
      projects.find((p) => lower.includes(p.name.toLowerCase())) ??
      projects.find((p) =>
        p.name
          .toLowerCase()
          .split(/\s+/)
          .some((w) => w.length > 2 && lower.includes(w)),
      );
    if (matched) return matched;

    // No explicit project named → resume wherever work last happened.
    const latest = await missionRepository.findLatestByWorkspace(workspaceId);
    if (latest) {
      return projects.find((p) => p.id === latest.projectId) ?? null;
    }
    return null;
  },
};

function readMemory(memory: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return memory && typeof memory === "object" && !Array.isArray(memory)
    ? (memory as Record<string, unknown>)
    : {};
}

function emptyPackage(sentence: string): ResumePackage {
  return {
    resolved: false,
    sentence,
    lastActive: null,
    currentObjective: null,
    youWereDoing: [],
    blockedBy: [],
    recentDecisions: [],
    relevantFiles: [],
    recommendedNextAction: "",
    confidence: null,
    estimatedMinutesToResume: 0,
    summary: "",
  };
}

function unresolved(sentence: string, message: string): ResumePackage {
  return { ...emptyPackage(sentence), message };
}
