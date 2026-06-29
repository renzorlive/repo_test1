import { missionRepository, workspaceRepository } from "@/server/repositories";
import type { ContextSources } from "@/server/ai/context-builder";

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

function asReferences(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    v && typeof v === "object" && "url" in v && "label" in v
      ? [
          {
            label: String((v as Record<string, unknown>).label),
            url: String((v as Record<string, unknown>).url),
          },
        ]
      : [],
  );
}

/**
 * Gather provider-agnostic context sources from repositories. Shared by the
 * Execution Engine (at run time) and the Execution Planner (for the wizard's
 * context preview), so there is exactly one definition of "what grounds a run".
 */
export async function gatherMissionContextSources(
  workspaceId: string,
  missionId?: string | null,
): Promise<ContextSources> {
  const workspace = await workspaceRepository.findById(workspaceId);
  const settings = (workspace?.settings ?? {}) as Record<string, unknown>;

  const base: ContextSources = {
    workspace: { id: workspaceId, name: workspace?.name ?? "Workspace" },
    architecture:
      typeof settings.architecture === "string" ? settings.architecture : null,
  };

  if (!missionId) return base;

  const mission = await missionRepository.findAggregate(missionId);
  if (!mission) return base;

  return {
    ...base,
    project: mission.project
      ? {
          id: mission.project.id,
          key: mission.project.key,
          name: mission.project.name,
        }
      : null,
    mission: {
      id: mission.id,
      title: mission.title,
      status: mission.status,
      objective: mission.objective,
      summary: mission.summary,
      outcome: mission.outcome,
      context: mission.context
        ? {
            background: mission.context.background,
            constraints: asStringArray(mission.context.constraints),
            assumptions: asStringArray(mission.context.assumptions),
            references: asReferences(mission.context.references),
          }
        : null,
      decisions: mission.decisions.map((d) => ({
        title: d.title,
        outcome: d.outcome,
      })),
      artifacts: mission.artifacts.map((a) => ({ name: a.name, type: a.type })),
      notes: mission.notes.map((n) => ({ body: n.body })),
      aiSessions: mission.aiSessions.map((s) => ({
        title: s.title,
        summary: s.summary,
        status: s.status,
      })),
    },
  };
}
