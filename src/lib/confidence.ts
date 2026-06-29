/**
 * Confidence v2 — how much the Company Brain knows, split by dimension.
 *
 * A single number hid the truth. The brain can be sure it can *plan* but sure
 * it *cannot deploy* without credentials. So confidence is four scores:
 * Knowledge, Planning, Execution, Deployment — each with its own threshold and
 * its own explainable signals. The brain gates each pipeline stage on the
 * dimension that matters for it.
 *
 * Pure and dependency-free: runs identically on the server (the gates) and the
 * client (the cockpit + resume panels).
 */

export type ConfidenceKey = "KNOWLEDGE" | "PLANNING" | "EXECUTION" | "DEPLOYMENT";

export interface ConfidenceSignal {
  label: string;
  present: boolean;
  weight: number;
}

export interface ConfidenceDimension {
  key: ConfidenceKey;
  label: string;
  score: number; // 0..100
  threshold: number;
  ok: boolean;
  signals: ConfidenceSignal[];
  missing: string[];
}

export interface ConfidenceResult {
  overall: number;
  dimensions: ConfidenceDimension[];
  /** The gate-relevant verdict for the EXECUTION stage. */
  canAutoExecute: boolean;
}

export interface ConfidenceInput {
  hasObjective: boolean;
  hasContext: boolean; // PRD / background
  hasArchitecture: boolean;
  decisionsCount: number;
  artifactsCount: number;
  tasksCount: number;
  priorSessionsCount: number;
  hasPlan: boolean;
  hasWorkers: boolean;
  hasDeployTarget: boolean;
  hasProdCredentials: boolean;
}

function dimension(
  key: ConfidenceKey,
  label: string,
  threshold: number,
  signals: ConfidenceSignal[],
): ConfidenceDimension {
  const total = signals.reduce((s, x) => s + x.weight, 0) || 1;
  const earned = signals.reduce((s, x) => s + (x.present ? x.weight : 0), 0);
  const score = Math.round((earned / total) * 100);
  return {
    key,
    label,
    score,
    threshold,
    ok: score >= threshold,
    signals,
    missing: signals.filter((x) => !x.present).map((x) => x.label),
  };
}

export function assessConfidence(input: ConfidenceInput): ConfidenceResult {
  const dimensions: ConfidenceDimension[] = [
    dimension("KNOWLEDGE", "Knowledge", 80, [
      { label: "PRD / context found", present: input.hasContext, weight: 35 },
      { label: "Previous decisions found", present: input.decisionsCount > 0, weight: 25 },
      { label: "Codebase / files indexed", present: input.artifactsCount > 0, weight: 25 },
      { label: "Prior runs found", present: input.priorSessionsCount > 0, weight: 15 },
    ]),
    dimension("PLANNING", "Planning", 80, [
      { label: "Objective defined", present: input.hasObjective, weight: 40 },
      { label: "Plan created", present: input.hasPlan, weight: 30 },
      { label: "Tasks broken down", present: input.tasksCount > 0, weight: 30 },
    ]),
    dimension("EXECUTION", "Execution", 75, [
      { label: "AI workers available", present: input.hasWorkers, weight: 40 },
      { label: "Tasks ready", present: input.tasksCount > 0, weight: 30 },
      { label: "Codebase indexed", present: input.artifactsCount > 0, weight: 30 },
    ]),
    dimension("DEPLOYMENT", "Deployment", 90, [
      { label: "Deployment target configured", present: input.hasDeployTarget, weight: 50 },
      { label: "Production credentials", present: input.hasProdCredentials, weight: 50 },
    ]),
  ];

  const overall = Math.round(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length,
  );
  const execution = dimensions.find((d) => d.key === "EXECUTION");

  return { overall, dimensions, canAutoExecute: execution?.ok ?? false };
}

/** Look up one dimension's verdict (used by the per-stage gates). */
export function dimensionOf(result: ConfidenceResult, key: ConfidenceKey) {
  return result.dimensions.find((d) => d.key === key);
}

/** Shape a mission aggregate (+ runtime facts) into the confidence input. */
export function confidenceInputFromMission(
  mission: {
    objective: string | null;
    context: { background: string | null } | null;
    decisions: { title: string }[];
    artifacts: unknown[];
    tasks: unknown[];
    aiSessions: unknown[];
    plan?: unknown | null;
  },
  facts?: { hasWorkers?: boolean; hasDeployTarget?: boolean; hasProdCredentials?: boolean },
): ConfidenceInput {
  return {
    hasObjective: Boolean(mission.objective),
    hasContext: Boolean(mission.context?.background),
    hasArchitecture: mission.decisions.some((d) => /architect/i.test(d.title)),
    decisionsCount: mission.decisions.length,
    artifactsCount: mission.artifacts.length,
    tasksCount: mission.tasks.length,
    priorSessionsCount: mission.aiSessions.length,
    hasPlan: Boolean(mission.plan),
    hasWorkers: facts?.hasWorkers ?? false,
    hasDeployTarget: facts?.hasDeployTarget ?? false,
    hasProdCredentials: facts?.hasProdCredentials ?? false,
  };
}
