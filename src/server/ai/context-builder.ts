import { estimateTokens } from "@/server/ai/tokens";
import type { ContextPackage, ContextSection } from "@/server/ai/types";

/**
 * Provider-agnostic inputs the Context Builder assembles into a package. The
 * engine gathers these from repositories; the builder is a pure transform so
 * it is deterministic and testable. NO provider-specific logic lives here.
 */
export interface ContextSources {
  workspace: { id: string; name: string };
  project?: { id: string; key: string; name: string } | null;
  mission?: {
    id: string;
    title: string;
    status: string;
    objective?: string | null;
    summary?: string | null;
    outcome?: string | null;
    context?: {
      background?: string | null;
      constraints?: string[];
      assumptions?: string[];
      references?: { label: string; url: string }[];
    } | null;
    decisions?: { title: string; outcome?: string | null }[];
    artifacts?: { name: string; type: string }[];
    notes?: { body: string }[];
    aiSessions?: { title: string; summary?: string | null; status: string }[];
  } | null;
  /** Architecture overview (e.g. from workspace settings or a living doc). */
  architecture?: string | null;
  /** Relevant files surfaced for this execution (path + optional summary). */
  relevantFiles?: { path: string; summary?: string | null }[];
}

function section(
  key: string,
  title: string,
  content: string,
): ContextSection | null {
  const trimmed = content.trim();
  if (!trimmed) return null;
  return { key, title, content: trimmed, tokensEstimated: estimateTokens(trimmed) };
}

function bulletList(items: string[]): string {
  return items
    .map((i) => i.trim())
    .filter(Boolean)
    .map((i) => `- ${i}`)
    .join("\n");
}

/**
 * The Context Builder. Assembles a structured context package from workspace,
 * project, mission, decisions, artifacts, architecture, relevant files, notes
 * and previous AI sessions. Returns ordered sections with token estimates.
 */
export const contextBuilder = {
  build(sources: ContextSources): ContextPackage {
    const sections: ContextSection[] = [];
    const push = (s: ContextSection | null) => {
      if (s) sections.push(s);
    };

    // Workspace
    push(section("workspace", "Workspace", `Operating in workspace "${sources.workspace.name}".`));

    // Project
    if (sources.project) {
      push(
        section(
          "project",
          "Project",
          `[${sources.project.key}] ${sources.project.name}`,
        ),
      );
    }

    // Mission core
    if (sources.mission) {
      const m = sources.mission;
      const lines = [
        `Title: ${m.title}`,
        `Status: ${m.status}`,
        m.objective ? `Objective: ${m.objective}` : "",
        m.summary ? `Summary: ${m.summary}` : "",
        m.outcome ? `Desired outcome: ${m.outcome}` : "",
      ].filter(Boolean);
      push(section("mission", "Mission", lines.join("\n")));

      // Working context
      if (m.context) {
        const ctxLines = [
          m.context.background ? `Background: ${m.context.background}` : "",
          m.context.constraints?.length
            ? `Constraints:\n${bulletList(m.context.constraints)}`
            : "",
          m.context.assumptions?.length
            ? `Assumptions:\n${bulletList(m.context.assumptions)}`
            : "",
          m.context.references?.length
            ? `References:\n${bulletList(m.context.references.map((r) => `${r.label} (${r.url})`))}`
            : "",
        ].filter(Boolean);
        push(section("mission_context", "Mission Context", ctxLines.join("\n\n")));
      }

      // Recent decisions
      if (m.decisions?.length) {
        push(
          section(
            "decisions",
            "Recent Decisions",
            bulletList(
              m.decisions
                .slice(0, 10)
                .map((d) => (d.outcome ? `${d.title} → ${d.outcome}` : d.title)),
            ),
          ),
        );
      }

      // Artifacts
      if (m.artifacts?.length) {
        push(
          section(
            "artifacts",
            "Artifacts",
            bulletList(m.artifacts.slice(0, 20).map((a) => `${a.name} [${a.type}]`)),
          ),
        );
      }

      // Notes
      if (m.notes?.length) {
        push(
          section(
            "notes",
            "Notes",
            bulletList(m.notes.slice(0, 10).map((n) => n.body)),
          ),
        );
      }

      // Previous AI sessions
      if (m.aiSessions?.length) {
        push(
          section(
            "previous_sessions",
            "Previous AI Sessions",
            bulletList(
              m.aiSessions
                .slice(0, 10)
                .map((s) => `${s.title} [${s.status}]${s.summary ? `: ${s.summary}` : ""}`),
            ),
          ),
        );
      }
    }

    // Architecture
    if (sources.architecture) {
      push(section("architecture", "Architecture", sources.architecture));
    }

    // Relevant files
    if (sources.relevantFiles?.length) {
      push(
        section(
          "relevant_files",
          "Relevant Files",
          bulletList(
            sources.relevantFiles.map((f) =>
              f.summary ? `${f.path} — ${f.summary}` : f.path,
            ),
          ),
        ),
      );
    }

    const totalTokensEstimated = sections.reduce(
      (sum, s) => sum + s.tokensEstimated,
      0,
    );

    return {
      workspace: sources.workspace,
      project: sources.project ?? null,
      mission: sources.mission
        ? {
            id: sources.mission.id,
            title: sources.mission.title,
            status: sources.mission.status,
          }
        : null,
      sections,
      totalTokensEstimated,
      generatedAt: new Date().toISOString(),
    };
  },
};
