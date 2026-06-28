"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import type {
  CreateApprovalInput,
  DecideApprovalInput,
  CreateNoteInput,
  CreateAiSessionInput,
  UpdateMissionInput,
} from "@/validations";

/**
 * Client actions for the Mission Workspace. Each method is a thin API call
 * followed by `router.refresh()`, which re-runs the server component and pulls
 * fresh aggregate data — no client-side cache to keep in sync. Business rules
 * stay on the server; this hook only moves data.
 */
export function useMissionActions(workspaceId: string, missionId: string) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const base = `/api/workspaces/${workspaceId}/missions/${missionId}`;

  const run = React.useCallback(
    async (fn: () => Promise<unknown>) => {
      setPending(true);
      setError(null);
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setPending(false);
      }
    },
    [router],
  );

  return {
    pending,
    error,
    updateMission: (input: UpdateMissionInput) =>
      run(() =>
        apiClient(base, { method: "PATCH", body: JSON.stringify(input) }),
      ),
    recompute: () => run(() => apiClient(`${base}/recompute`, { method: "POST" })),
    requestApproval: (input: CreateApprovalInput) =>
      run(() =>
        apiClient(`${base}/approvals`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    decideApproval: (approvalId: string, input: DecideApprovalInput) =>
      run(() =>
        apiClient(`${base}/approvals/${approvalId}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        }),
      ),
    addNote: (input: CreateNoteInput) =>
      run(() =>
        apiClient(`${base}/notes`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
    startSession: (input: CreateAiSessionInput) =>
      run(() =>
        apiClient(`${base}/ai-sessions`, {
          method: "POST",
          body: JSON.stringify(input),
        }),
      ),
  };
}
