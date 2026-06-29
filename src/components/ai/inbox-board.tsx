"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ShieldQuestion,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Coins,
  Gauge,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExecutionStateBadge } from "./execution-state-badge";
import { useExecutionActions } from "@/hooks/use-execution-actions";
import { formatRelativeTime } from "@/lib/utils";
import type { AiInboxData } from "@/server/services";

type InboxItem = AiInboxData["failed"][number];

interface Caps {
  canApprove: boolean;
  canRun: boolean;
}

export function InboxBoard({
  data,
  workspaceId,
  caps,
}: {
  data: AiInboxData;
  workspaceId: string;
  caps: Caps;
}) {
  const actions = useExecutionActions(workspaceId);

  const lanes: {
    key: string;
    title: string;
    icon: LucideIcon;
    tone: string;
    items: InboxItem[];
    kind: "approval" | "retry" | "plain";
  }[] = [
    {
      key: "waiting",
      title: "Waiting approval",
      icon: ShieldQuestion,
      tone: "text-amber-500",
      items: data.waitingApproval,
      kind: "approval",
    },
    {
      key: "failed",
      title: "Failed executions",
      icon: XCircle,
      tone: "text-red-500",
      items: data.failed,
      kind: "retry",
    },
    {
      key: "retry",
      title: "Retry suggestions",
      icon: RefreshCw,
      tone: "text-amber-500",
      items: data.retrySuggestions,
      kind: "retry",
    },
    {
      key: "highcost",
      title: `High cost (≥ $${data.thresholds.highCostUsd.toFixed(2)})`,
      icon: Coins,
      tone: "text-orange-500",
      items: data.highCost,
      kind: "plain",
    },
    {
      key: "lowconf",
      title: `Low confidence (< ${data.thresholds.lowConfidence})`,
      icon: Gauge,
      tone: "text-violet-500",
      items: data.lowConfidence,
      kind: "plain",
    },
    {
      key: "completed",
      title: "Recently completed",
      icon: CheckCircle2,
      tone: "text-emerald-500",
      items: data.completed,
      kind: "plain",
    },
  ];

  return (
    <div className="space-y-4">
      {actions.error && (
        <p className="text-sm text-destructive">{actions.error}</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {lanes.map((lane) => {
          const Icon = lane.icon;
          return (
            <Card key={lane.key} className="flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Icon className={`h-4 w-4 ${lane.tone}`} />
                  {lane.title}
                </CardTitle>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                  {lane.items.length}
                </span>
              </CardHeader>
              <CardContent className="flex-1 space-y-2">
                {lane.items.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Nothing here.
                  </p>
                ) : (
                  lane.items.map((item) => (
                    <div key={item.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/orchestrator/executions/${item.id}`}
                          className="text-sm font-medium hover:underline"
                        >
                          {item.title}
                        </Link>
                        <ExecutionStateBadge state={item.state} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {item.worker && <span>{item.worker.name}</span>}
                        {item.cost && (
                          <span>${item.cost.totalCost.toFixed(3)}</span>
                        )}
                        {item.confidence !== null && (
                          <span>conf {Math.round(item.confidence * 100)}%</span>
                        )}
                        <span>{formatRelativeTime(item.createdAt)}</span>
                      </div>
                      {item.error && (
                        <p className="mt-1 line-clamp-2 text-xs text-destructive">
                          {item.error}
                        </p>
                      )}

                      {/* Lane actions */}
                      {lane.kind === "approval" && caps.canApprove && (
                        <div className="mt-2 flex gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actions.pendingId === item.id}
                            onClick={() => actions.approve(item.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={actions.pendingId === item.id}
                            onClick={() => actions.reject(item.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {lane.kind === "retry" &&
                        caps.canRun &&
                        item.attempt < item.maxAttempts && (
                          <div className="mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actions.pendingId === item.id}
                              onClick={() => actions.retry(item.id)}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Retry ({item.attempt}/{item.maxAttempts})
                            </Button>
                          </div>
                        )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
