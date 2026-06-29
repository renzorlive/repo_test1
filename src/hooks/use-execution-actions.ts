"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

/**
 * Client actions for AI executions (approve / reject / retry / cancel /
 * advance). Thin API calls + `router.refresh()` to re-pull server data. Keyed
 * by execution id so a single hook instance can drive a whole list (the inbox).
 */
export function useExecutionActions(
  workspaceId: string,
  options?: { onAfter?: () => void | Promise<void> },
) {
  const router = useRouter();
  const onAfter = options?.onAfter;
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(
    async (executionId: string, path: string, body?: unknown) => {
      setPendingId(executionId);
      setError(null);
      try {
        await apiClient(
          `/api/workspaces/${workspaceId}/ai/executions/${executionId}${path}`,
          { method: "POST", body: body ? JSON.stringify(body) : undefined },
        );
        // Prefer an explicit refetch (e.g. React Query in the wizard); fall back
        // to refreshing the server components (e.g. the inbox list).
        if (onAfter) await onAfter();
        else router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setPendingId(null);
      }
    },
    [workspaceId, router, onAfter],
  );

  return {
    pendingId,
    error,
    approve: (id: string) => run(id, "/approve"),
    reject: (id: string) => run(id, "/reject", { reason: "Rejected from inbox" }),
    retry: (id: string) => run(id, "/retry"),
    cancel: (id: string) => run(id, "/cancel"),
    advance: (id: string) => run(id, "/advance"),
    /**
     * Report a (simulated) successful worker result. Until provider adapters
     * exist, this stands in for the external worker callback so the full
     * execution → completion → summary flow is demonstrable end to end.
     */
    simulateComplete: (id: string) =>
      run(id, "/complete", {
        content:
          "Simulated result. Wire a provider adapter to replace this with a real model response.",
        confidence: 0.86,
        inputTokens: 3200,
        outputTokens: 900,
        latencyMs: 6400,
      }),
  };
}
