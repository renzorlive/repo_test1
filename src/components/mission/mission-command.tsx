"use client";

import {
  BrainCircuit,
  ArrowRight,
  Check,
  MessageSquareWarning,
  PartyPopper,
  Paperclip,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MissionPipeline } from "./mission-pipeline";
import { ActivityFeed } from "./activity-feed";
import { useMissionBrain } from "@/hooks/use-mission-brain";
import type { MissionAggregate } from "@/server/repositories";

interface Props {
  mission: MissionAggregate;
  workspaceId: string;
  caps: { canApprove: boolean; canEdit: boolean };
}

/**
 * Founder Mode cockpit. One objective, managed autonomously: the founder sees
 * the pipeline, the brain's narration and the deliverables — and only ever has
 * to approve. No worker, provider, runtime, prompt or context in sight.
 */
export function MissionCommand({ mission, workspaceId, caps }: Props) {
  const brain = useMissionBrain(workspaceId, mission.id);
  const stages = mission.plan?.stages ?? [];
  const waiting = stages.find((s) => s.status === "WAITING_APPROVAL");
  const done = stages.filter((s) =>
    ["COMPLETED", "SKIPPED"].includes(s.status),
  ).length;
  const complete =
    mission.status === "COMPLETED" || mission.plan?.status === "COMPLETED";
  const current = stages.find((s) =>
    ["PENDING", "ACTIVE", "WAITING_APPROVAL"].includes(s.status),
  );

  return (
    <div className="space-y-6">
      {/* Primary action */}
      {waiting ? (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
                <MessageSquareWarning className="h-4 w-4" />
                The brain needs your approval
              </p>
              <p className="text-lg font-semibold">{waiting.title}</p>
            </div>
            {caps.canApprove && (
              <div className="flex gap-2">
                <Button
                  disabled={brain.pending}
                  onClick={() => brain.approveStage(waiting.id)}
                >
                  <Check className="h-4 w-4" />
                  Approve & continue
                </Button>
                <Button
                  variant="outline"
                  disabled={brain.pending}
                  onClick={() => brain.rejectStage(waiting.id)}
                >
                  Request changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : complete ? (
        <Card className="border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 p-5">
            <PartyPopper className="h-6 w-6 text-emerald-500" />
            <div>
              <p className="text-lg font-semibold">Mission shipped</p>
              <p className="text-sm text-muted-foreground">
                The brain planned, built, reviewed and delivered the outcome.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-sm font-medium text-primary">
                <BrainCircuit className="h-4 w-4" />
                Mission Brain is managing this
              </p>
              <p className="text-lg font-semibold">
                {current ? `Next: ${current.title}` : "Ready"}
              </p>
            </div>
            {caps.canEdit && (
              <Button disabled={brain.pending} onClick={() => brain.advance()}>
                {brain.pending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Continue
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {brain.error && <p className="text-sm text-destructive">{brain.error}</p>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Pipeline */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Pipeline</CardTitle>
            <span className="text-xs text-muted-foreground">
              {done}/{stages.length}
            </span>
          </CardHeader>
          <CardContent>
            <MissionPipeline stages={stages} />
          </CardContent>
        </Card>

        {/* Brain narration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>What the brain is doing</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityFeed items={mission.activities.slice(0, 8)} />
          </CardContent>
        </Card>
      </div>

      {/* Deliverables — the outcome the founder actually bought */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Deliverables</CardTitle>
          <Paperclip className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {mission.artifacts.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Deliverables will appear here as the brain produces them.
            </p>
          ) : (
            <ul className="divide-y">
              {mission.artifacts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <span className="text-sm font-medium">{a.name}</span>
                  <Badge variant="secondary">{a.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
