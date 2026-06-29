"use client";

import Link from "next/link";
import { ChevronDown, RefreshCw, ArrowLeft, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMissionActions } from "@/hooks/use-mission-actions";
import { getInitials } from "@/lib/utils";
import type { MissionStatus } from "@/types";
import { HealthBadge } from "./health-badge";
import type { MissionAggregateView } from "./mission-workspace";

const STATUSES: MissionStatus[] = [
  "DRAFT",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
];

interface Props {
  mission: MissionAggregateView;
  workspaceId: string;
  canEdit: boolean;
}

export function MissionHeader({ mission, workspaceId, canEdit }: Props) {
  const actions = useMissionActions(workspaceId, mission.id);

  return (
    <div className="space-y-4">
      <Link
        href="/missions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All missions
      </Link>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {mission.project.key}
            </Badge>
            <StatusBadge status={mission.status} />
            <HealthBadge health={mission.health} />
            <PriorityBadge priority={mission.priority} />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mission.title}
          </h1>
          {mission.summary && (
            <p className="max-w-2xl text-sm text-muted-foreground">
              {mission.summary}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {mission.owner && (
            <div className="hidden items-center gap-2 rounded-lg border px-3 py-1.5 sm:flex">
              <Avatar className="h-6 w-6">
                <AvatarImage src={mission.owner.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {getInitials(mission.owner.name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{mission.owner.name}</span>
            </div>
          )}

          {/* The single primary CTA of the mission page. */}
          <Button asChild size="lg" className="font-semibold">
            <Link href={`/missions/${mission.id}/execute`}>
              <Play className="h-4 w-4 fill-current" />
              Execute Mission
            </Link>
          </Button>

          {canEdit && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={actions.pending}
                onClick={() => actions.recompute()}
              >
                <RefreshCw className="h-4 w-4" />
                Recompute
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" disabled={actions.pending}>
                    Status
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STATUSES.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      disabled={status === mission.status}
                      onClick={() => actions.updateMission({ status })}
                    >
                      <StatusBadge status={status} />
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={mission.progress} className="max-w-md" />
        <span className="text-sm font-medium">{mission.progress}%</span>
      </div>

      {actions.error && (
        <p className="text-sm text-destructive">{actions.error}</p>
      )}
    </div>
  );
}
