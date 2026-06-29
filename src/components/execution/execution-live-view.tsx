"use client";

import Link from "next/link";
import {
  Cpu,
  Coins,
  Hash,
  Timer,
  FileText,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExecutionStateBadge } from "@/components/ai/execution-state-badge";
import { ExecutionEventFeed } from "@/components/ai/execution-event-feed";
import { useExecutionActions } from "@/hooks/use-execution-actions";
import type { AiExecutionAggregate } from "@/server/repositories";

interface Props {
  execution: AiExecutionAggregate;
  workspaceId: string;
  caps: { canApprove: boolean; canRun: boolean };
  missionId: string;
  remainingTasks: number;
  refetch: () => Promise<unknown>;
  onRunAnother: () => void;
}

function formatDuration(fromIso: Date | string, toIso: Date | string): string {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  if (ms < 1000) return "<1s";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export function ExecutionLiveView({
  execution: exec,
  workspaceId,
  caps,
  missionId,
  remainingTasks,
  refetch,
  onRunAnother,
}: Props) {
  const actions = useExecutionActions(workspaceId, {
    onAfter: async () => {
      await refetch();
    },
  });
  const busy = actions.pendingId === exec.id;
  const isTerminal = ["COMPLETED", "FAILED", "CANCELLED"].includes(exec.state);
  const elapsed = formatDuration(
    exec.runningAt ?? exec.createdAt,
    exec.completedAt ?? exec.failedAt ?? new Date(),
  );

  return (
    <div className="space-y-6">
      {/* Status banner + next suggested action */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ExecutionStateBadge state={exec.state} />
              <span className="text-sm text-muted-foreground">{elapsed} elapsed</span>
            </div>
            <h2 className="text-lg font-semibold">{exec.title}</h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              {nextAction(exec.state).hint}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {exec.state === "WAITING_APPROVAL" && caps.canApprove && (
              <>
                <Button disabled={busy} onClick={() => actions.approve(exec.id)}>
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => actions.reject(exec.id)}
                >
                  Reject
                </Button>
              </>
            )}
            {exec.state === "FAILED" && caps.canRun && (
              <Button disabled={busy} onClick={() => actions.retry(exec.id)}>
                <RotateCcw className="h-4 w-4" />
                Retry
              </Button>
            )}
            {exec.state === "RUNNING" && caps.canRun && (
              <Button disabled={busy} onClick={() => actions.simulateComplete(exec.id)}>
                Simulate worker result
              </Button>
            )}
            {!isTerminal &&
              caps.canRun &&
              exec.state !== "WAITING_APPROVAL" &&
              exec.state !== "RUNNING" && (
                <Button disabled={busy} onClick={() => actions.advance(exec.id)}>
                  <ArrowRight className="h-4 w-4" />
                  Advance
                </Button>
              )}
          </div>
        </CardContent>
      </Card>

      {actions.error && <p className="text-sm text-destructive">{actions.error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat icon={Cpu} label="Worker">
          {exec.worker ? `${exec.worker.name} · ${exec.worker.model.label}` : "Scheduling…"}
        </Stat>
        <Stat icon={Timer} label="Attempt">
          {exec.attempt}/{exec.maxAttempts}
        </Stat>
        <Stat icon={Coins} label="Cost">
          ${exec.cost ? exec.cost.totalCost.toFixed(4) : "0.0000"}
        </Stat>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Live timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutionEventFeed
              events={exec.events.map((e) => ({
                id: e.id,
                type: e.type,
                message: e.message,
                createdAt: e.createdAt,
                execution: { id: exec.id, title: exec.title },
              }))}
              linkToExecution={false}
            />
          </CardContent>
        </Card>

        {/* Logs + artifacts */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {exec.logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No logs yet.</p>
              ) : (
                <ul className="space-y-1 font-mono text-xs">
                  {exec.logs.map((l) => (
                    <li key={l.id}>
                      <span className="font-semibold">[{l.level}]</span> {l.message}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Generated files</CardTitle>
            </CardHeader>
            <CardContent>
              {exec.artifacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No artifacts produced yet.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {exec.artifacts.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {a.name}
                      <Badge variant="secondary">{a.type}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Auto-generated execution summary */}
      {exec.state === "COMPLETED" && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Execution summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Summary
              </p>
              <p className="text-sm">
                {exec.result?.content ?? "Execution completed."}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryStat icon={Hash} label="Tokens">
                {exec.usage ? exec.usage.totalTokens.toLocaleString() : 0}
              </SummaryStat>
              <SummaryStat icon={Coins} label="Total cost">
                ${exec.cost ? exec.cost.totalCost.toFixed(4) : "0.0000"}
              </SummaryStat>
              <SummaryStat icon={FileText} label="Files changed">
                {exec.artifacts.length}
              </SummaryStat>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Estimated remaining work
              </p>
              <p className="text-sm">
                {remainingTasks === 0
                  ? "No open tasks remain on this mission."
                  : `${remainingTasks} open task${remainingTasks === 1 ? "" : "s"} remaining on this mission.`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button onClick={onRunAnother}>
                <Sparkles className="h-4 w-4" />
                Run another execution
              </Button>
              <Button asChild variant="outline">
                <Link href={`/missions/${missionId}`}>Back to mission</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function nextAction(state: string): { hint: string } {
  switch (state) {
    case "QUEUED":
    case "PREPARING":
    case "BUILDING_CONTEXT":
      return { hint: "Preparing the run — advance to continue." };
    case "RUNNING":
      return { hint: "Worker is running. Awaiting result callback." };
    case "WAITING_APPROVAL":
      return { hint: "Needs your approval before it can continue." };
    case "FAILED":
      return { hint: "Run failed — retry when ready." };
    case "COMPLETED":
      return { hint: "Run complete. Review the summary below." };
    case "CANCELLED":
      return { hint: "Run was cancelled." };
    default:
      return { hint: "" };
  }
}

function Stat({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Cpu;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-medium">{children}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryStat({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Cpu;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{children}</p>
      </div>
    </div>
  );
}
