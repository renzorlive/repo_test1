"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RuntimeExecutionAggregate } from "@/server/repositories";

const TERMINAL = ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"];

/** Poll a runtime execution (terminal output) while the job is in flight. */
export function useRuntimeExecution(
  workspaceId: string,
  executionId: string | null,
) {
  return useQuery({
    queryKey: ["runtime-execution", workspaceId, executionId],
    enabled: Boolean(executionId),
    queryFn: () =>
      apiClient<RuntimeExecutionAggregate>(
        `/api/workspaces/${workspaceId}/runtime/executions/${executionId}`,
      ),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && TERMINAL.includes(status) ? false : 2000;
    },
  });
}
