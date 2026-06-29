"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

/** Cancel / retry runtime jobs (and dispatch AI executions to a host). */
export function useRuntimeActions(
  workspaceId: string,
  options?: { onAfter?: () => void | Promise<void> },
) {
  const router = useRouter();
  const onAfter = options?.onAfter;
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async <T>(path: string, body?: unknown): Promise<T | null> => {
      setPending(true);
      setError(null);
      try {
        const data = await apiClient<T>(`/api/workspaces/${workspaceId}${path}`, {
          method: "POST",
          body: body ? JSON.stringify(body) : undefined,
        });
        if (onAfter) await onAfter();
        else router.refresh();
        return data;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
        return null;
      } finally {
        setPending(false);
      }
    },
    [workspaceId, router, onAfter],
  );

  return {
    pending,
    error,
    cancel: (id: string) => run(`/runtime/executions/${id}/cancel`),
    retry: (id: string) => run(`/runtime/executions/${id}/retry`),
    dispatchAiExecution: (aiExecutionId: string, hostId: string) =>
      run<{ id: string }>(
        `/runtime/ai-executions/${aiExecutionId}/dispatch`,
        { hostId },
      ),
  };
}
