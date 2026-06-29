import { aiInboxRepository, INBOX_THRESHOLDS } from "@/server/repositories";
import { requireAiAccess } from "@/server/services/ai-access";

/**
 * AiInboxService — assembles the six triage lanes of the AI Inbox in parallel:
 * waiting approval, failed, completed, retry suggestions, high-cost warnings
 * and low-confidence results.
 */
export const aiInboxService = {
  async get(workspaceId: string) {
    await requireAiAccess(workspaceId, "view");

    const [
      waitingApproval,
      failed,
      completed,
      retrySuggestions,
      highCost,
      lowConfidence,
    ] = await Promise.all([
      aiInboxRepository.waitingApproval(workspaceId),
      aiInboxRepository.failed(workspaceId, 10),
      aiInboxRepository.completed(workspaceId, 10),
      aiInboxRepository.retrySuggestions(workspaceId),
      aiInboxRepository.highCost(workspaceId),
      aiInboxRepository.lowConfidence(workspaceId),
    ]);

    return {
      thresholds: INBOX_THRESHOLDS,
      waitingApproval,
      failed,
      completed,
      retrySuggestions,
      highCost,
      lowConfidence,
    };
  },
};

export type AiInboxData = Awaited<ReturnType<typeof aiInboxService.get>>;
