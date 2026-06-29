import { aiWorkerRepository, type AiWorkerWithRefs } from "@/server/repositories";
import type { AiCapabilityKind } from "@/types";

/**
 * Worker Registry scheduling.
 *
 * Selects the best worker for a required capability — the scheduler at the
 * heart of "Kubernetes for AI workers". Candidates must be ACTIVE/IDLE, not
 * UNHEALTHY, advertise the capability, and have a free concurrency slot. Among
 * those, highest priority wins, ties broken by least in-flight load.
 */
export const workerRegistry = {
  async select(
    workspaceId: string,
    capability: AiCapabilityKind,
  ): Promise<AiWorkerWithRefs | null> {
    const candidates = await aiWorkerRepository.findCandidates(
      workspaceId,
      capability,
    );

    const available = candidates.filter(
      (c) => c.inFlight < c.worker.concurrency,
    );
    if (available.length === 0) return null;

    available.sort(
      (a, b) =>
        b.worker.priority - a.worker.priority || a.inFlight - b.inFlight,
    );

    return available[0]!.worker;
  },
};
