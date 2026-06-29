"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";

/**
 * Drives the Mission Brain from the UI: advance the pipeline, approve/reject the
 * stage it paused on, and switch Founder/Advanced mode. Each call refreshes the
 * server-rendered mission so the pipeline reflects the brain's new state.
 */
export function useMissionBrain(workspaceId: string, missionId: string) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const base = `/api/workspaces/${workspaceId}/missions/${missionId}`;

  const run = React.useCallback(
    async (path: string, method: "POST" | "PATCH" = "POST", body?: unknown) => {
      setPending(true);
      setError(null);
      try {
        await apiClient(`${base}${path}`, {
          method,
          body: body ? JSON.stringify(body) : undefined,
        });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setPending(false);
      }
    },
    [base, router],
  );

  return {
    pending,
    error,
    advance: (force = false) => run("/advance-brain", "POST", { force }),
    approveStage: (stageId: string) => run(`/stages/${stageId}/approve`),
    rejectStage: (stageId: string) => run(`/stages/${stageId}/reject`),
    setMode: (mode: "FOUNDER" | "ADVANCED") => run("/mode", "PATCH", { mode }),
  };
}
