/**
 * Memory Sources — where the Company Brain's memory actually comes from.
 *
 * A Memory Source is any system that holds what a company knows: the local
 * project history (decisions, artifacts, activity — the substrate we already
 * have), a GitHub repository, a Notion workspace, a Slack export… Each is read
 * through one narrow interface so the brain stays vendor-agnostic: it asks a
 * source for relevant fragments and never learns where they live.
 *
 * This is the seam for the "Memory Source #1" capability. The registry starts
 * with the LOCAL source (mission/project memory) and grows — GitHub next — by
 * adding adapters, never by changing the brain.
 */

export type MemorySourceKind = "LOCAL" | "GITHUB" | "NOTION" | "SLACK";

export interface MemoryQuery {
  workspaceId: string;
  /** Free-text intent, e.g. the objective or the resume sentence. */
  intent: string;
  /** Optional scoping to one project/mission. */
  projectId?: string;
  missionId?: string;
  limit?: number;
}

export interface MemoryFragment {
  source: MemorySourceKind;
  /** A stable identifier within the source. */
  ref: string;
  kind: "decision" | "file" | "activity" | "conversation" | "doc";
  title: string;
  snippet: string;
  /** 0..1 — how relevant the source judged this fragment. */
  relevance: number;
  occurredAt?: Date | string;
}

export interface MemorySource {
  kind: MemorySourceKind;
  /** Whether this source is configured/reachable for the workspace. */
  isAvailable(workspaceId: string): Promise<boolean>;
  /** Pull the most relevant fragments for a query. */
  retrieve(query: MemoryQuery): Promise<MemoryFragment[]>;
}

/**
 * The LOCAL source — the company's own RNZ OS history. This adapter is the
 * canonical reference implementation; today the brain reads this substrate
 * directly through the repositories, so the adapter is intentionally thin and
 * declares the contract the GitHub source will mirror.
 */
export const localMemorySource: MemorySource = {
  kind: "LOCAL",
  async isAvailable() {
    return true; // every workspace always has its own history
  },
  async retrieve(_query: MemoryQuery): Promise<MemoryFragment[]> {
    // Retrieval currently runs through companyBrain.retrieveContext over the
    // mission aggregate. This adapter is the forward-compatible entry point;
    // wiring it as the brain's first registered source is the next step.
    return [];
  },
};

/**
 * The Memory Source registry — vendor-agnostic, empty-by-design beyond LOCAL.
 * Adding GitHub is `register(githubMemorySource)`, nothing in the brain changes.
 */
const sources = new Map<MemorySourceKind, MemorySource>([["LOCAL", localMemorySource]]);

export const memorySources = {
  register(source: MemorySource) {
    sources.set(source.kind, source);
  },
  get(kind: MemorySourceKind) {
    return sources.get(kind) ?? null;
  },
  list() {
    return [...sources.values()];
  },
  /** Sources actually usable for a workspace right now. */
  async available(workspaceId: string) {
    const checked = await Promise.all(
      [...sources.values()].map(async (s) => ({
        source: s,
        ok: await s.isAvailable(workspaceId),
      })),
    );
    return checked.filter((c) => c.ok).map((c) => c.source);
  },
};
