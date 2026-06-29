/**
 * Confidence — how much the Company Brain knows before it acts.
 *
 * This is the mechanism that lets the system "know when it doesn't know". Before
 * a mission executes autonomously, the brain scores itself from explainable
 * signals. Below the threshold it must NOT execute on its own — it asks the
 * founder for the missing context instead.
 *
 * Pure and dependency-free so it runs identically on the server (the brain's
 * gate) and the client (the cockpit's panel).
 */

export const CONFIDENCE_THRESHOLD = 85;

export interface ConfidenceSignal {
  label: string;
  present: boolean;
  weight: number;
}

export interface ConfidenceResult {
  score: number; // 0..100
  threshold: number;
  canAutoExecute: boolean;
  signals: ConfidenceSignal[];
  /** Human-readable list of what's missing, for the "ask for context" prompt. */
  missing: string[];
}

export interface ConfidenceInput {
  hasObjective: boolean;
  hasContext: boolean; // PRD / background
  hasArchitecture: boolean;
  decisionsCount: number;
  artifactsCount: number;
  tasksCount: number;
  priorSessionsCount: number;
}

/** Score the brain's readiness to execute. Weights sum to 100. */
export function assessConfidence(input: ConfidenceInput): ConfidenceResult {
  const signals: ConfidenceSignal[] = [
    { label: "Objective defined", present: input.hasObjective, weight: 15 },
    { label: "PRD / context found", present: input.hasContext, weight: 20 },
    { label: "Architecture found", present: input.hasArchitecture, weight: 15 },
    { label: "Previous decisions found", present: input.decisionsCount > 0, weight: 15 },
    { label: "Codebase / artifacts indexed", present: input.artifactsCount > 0, weight: 15 },
    { label: "Tasks broken down", present: input.tasksCount > 0, weight: 12 },
    { label: "Prior runs found", present: input.priorSessionsCount > 0, weight: 8 },
  ];

  const total = signals.reduce((s, x) => s + x.weight, 0);
  const earned = signals.reduce((s, x) => s + (x.present ? x.weight : 0), 0);
  const score = Math.round((earned / total) * 100);

  return {
    score,
    threshold: CONFIDENCE_THRESHOLD,
    canAutoExecute: score >= CONFIDENCE_THRESHOLD,
    signals,
    missing: signals.filter((x) => !x.present).map((x) => x.label),
  };
}

/** Shape any mission aggregate into the confidence input. */
export function confidenceInputFromMission(mission: {
  objective: string | null;
  context: { background: string | null } | null;
  decisions: { title: string }[];
  artifacts: unknown[];
  tasks: unknown[];
  aiSessions: unknown[];
}): ConfidenceInput {
  return {
    hasObjective: Boolean(mission.objective),
    hasContext: Boolean(mission.context?.background),
    hasArchitecture: mission.decisions.some((d) => /architect/i.test(d.title)),
    decisionsCount: mission.decisions.length,
    artifactsCount: mission.artifacts.length,
    tasksCount: mission.tasks.length,
    priorSessionsCount: mission.aiSessions.length,
  };
}
