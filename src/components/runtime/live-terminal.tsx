"use client";

import * as React from "react";
import { TerminalSquare, Ban, RotateCcw, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RuntimeExecutionBadge } from "./runtime-badges";
import { useRuntimeActions } from "@/hooks/use-runtime-actions";
import { cn } from "@/lib/utils";
import type { RuntimeExecutionAggregate } from "@/server/repositories";

const TERMINAL_STATES = ["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"];

function formatClock(value: Date | string) {
  return new Date(value).toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(from: Date | string | null, to: Date | string | null) {
  if (!from) return "—";
  const ms = new Date(to ?? new Date()).getTime() - new Date(from).getTime();
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const STREAM_COLOR: Record<string, string> = {
  STDOUT: "text-zinc-100",
  STDERR: "text-red-400",
  SYSTEM: "text-cyan-400",
};

interface Props {
  execution: RuntimeExecutionAggregate;
  workspaceId: string;
  canOperate: boolean;
  refetch: () => Promise<unknown>;
}

/**
 * Live terminal view of a runtime job: stdout/stderr/system lines with
 * timestamps, status, exit code and live execution time. Auto-scrolls as the
 * remote agent streams output.
 */
export function LiveTerminal({
  execution: exec,
  workspaceId,
  canOperate,
  refetch,
}: Props) {
  const actions = useRuntimeActions(workspaceId, {
    onAfter: async () => {
      await refetch();
    },
  });
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isTerminal = TERMINAL_STATES.includes(exec.status);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [exec.logs.length]);

  return (
    <div className="overflow-hidden rounded-xl border">
      {/* Terminal header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <TerminalSquare className="h-4 w-4 text-muted-foreground" />
          {exec.command.command} {exec.host ? `· ${exec.host.name}` : ""}
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(exec.startedAt, exec.finishedAt)}
          </span>
          {exec.exitCode !== null && (
            <span className="font-mono text-xs text-muted-foreground">
              exit {exec.exitCode}
            </span>
          )}
          <RuntimeExecutionBadge status={exec.status} />
          {canOperate && !isTerminal && (
            <Button
              size="sm"
              variant="outline"
              disabled={actions.pending}
              onClick={() => actions.cancel(exec.id)}
            >
              <Ban className="h-3.5 w-3.5" />
              Cancel
            </Button>
          )}
          {canOperate && isTerminal && (
            <Button
              size="sm"
              variant="outline"
              disabled={actions.pending}
              onClick={() => actions.retry(exec.id)}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto bg-zinc-950 p-3 font-mono text-xs leading-relaxed scrollbar-thin"
      >
        {exec.logs.length === 0 ? (
          <p className="text-zinc-500">Waiting for output…</p>
        ) : (
          exec.logs.map((line) => (
            <div key={line.id} className="flex gap-2">
              <span className="shrink-0 select-none text-zinc-600">
                {formatClock(line.createdAt)}
              </span>
              <span
                className={cn(
                  "whitespace-pre-wrap break-all",
                  STREAM_COLOR[line.stream] ?? "text-zinc-100",
                )}
              >
                {line.content}
              </span>
            </div>
          ))
        )}
      </div>

      {actions.error && (
        <p className="border-t bg-destructive/5 px-4 py-2 text-sm text-destructive">
          {actions.error}
        </p>
      )}

      {/* Generated files */}
      {exec.artifacts.length > 0 && (
        <div className="border-t p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Generated files ({exec.artifacts.length})
          </p>
          <ul className="space-y-1">
            {exec.artifacts.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-xs">{a.path}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {a.change.toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
