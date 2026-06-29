"use client";

import { Loader2 } from "lucide-react";
import { LiveTerminal } from "./live-terminal";
import { useRuntimeExecution } from "@/hooks/use-runtime-execution";
import type { RuntimeExecutionAggregate } from "@/server/repositories";

/**
 * Client wrapper that live-polls a runtime execution and renders its terminal.
 * Accepts a server-rendered `initial` so the first paint is instant.
 */
export function RuntimeExecutionView({
  workspaceId,
  executionId,
  canOperate,
  initial,
}: {
  workspaceId: string;
  executionId: string;
  canOperate: boolean;
  initial?: RuntimeExecutionAggregate;
}) {
  const query = useRuntimeExecution(workspaceId, executionId);
  const execution = query.data ?? initial;

  if (!execution) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Connecting to terminal…
      </div>
    );
  }

  return (
    <LiveTerminal
      execution={execution}
      workspaceId={workspaceId}
      canOperate={canOperate}
      refetch={query.refetch}
    />
  );
}
