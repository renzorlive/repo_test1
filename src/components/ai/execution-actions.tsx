"use client";

import { Check, X, RefreshCw, Ban, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExecutionActions } from "@/hooks/use-execution-actions";
import type { AiExecutionState } from "@/types";

interface Props {
  workspaceId: string;
  executionId: string;
  state: AiExecutionState;
  canApprove: boolean;
  canRun: boolean;
}

const ACTIVE_STATES: AiExecutionState[] = [
  "QUEUED",
  "PREPARING",
  "BUILDING_CONTEXT",
  "RUNNING",
  "RETRYING",
];

export function ExecutionActions({
  workspaceId,
  executionId,
  state,
  canApprove,
  canRun,
}: Props) {
  const actions = useExecutionActions(workspaceId);
  const busy = actions.pendingId === executionId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state === "WAITING_APPROVAL" && canApprove && (
        <>
          <Button size="sm" disabled={busy} onClick={() => actions.approve(executionId)}>
            <Check className="h-4 w-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => actions.reject(executionId)}
          >
            <X className="h-4 w-4" />
            Reject
          </Button>
        </>
      )}

      {state === "FAILED" && canRun && (
        <Button size="sm" disabled={busy} onClick={() => actions.retry(executionId)}>
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}

      {ACTIVE_STATES.includes(state) && canRun && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => actions.advance(executionId)}
          >
            <ChevronRight className="h-4 w-4" />
            Advance
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => actions.cancel(executionId)}
          >
            <Ban className="h-4 w-4" />
            Cancel
          </Button>
        </>
      )}

      {actions.error && (
        <span className="text-sm text-destructive">{actions.error}</span>
      )}
    </div>
  );
}
