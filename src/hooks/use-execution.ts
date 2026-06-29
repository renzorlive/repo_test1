"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { AiExecutionAggregate } from "@/server/repositories";

const TERMINAL = ["COMPLETED", "FAILED", "CANCELLED"];

/**
 * Poll a single execution aggregate while it is in flight. Polling stops once
 * the execution reaches a terminal state, so the live view settles on its own.
 */
export function useExecution(
  workspaceId: string,
  executionId: string | null,
) {
  return useQuery({
    queryKey: ["ai-execution", workspaceId, executionId],
    enabled: Boolean(executionId),
    queryFn: () =>
      apiClient<AiExecutionAggregate>(
        `/api/workspaces/${workspaceId}/ai/executions/${executionId}`,
      ),
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      return state && TERMINAL.includes(state) ? false : 2500;
    },
  });
}
