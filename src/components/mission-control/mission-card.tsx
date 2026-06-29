import Link from "next/link";
import { Play, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { HealthBadge } from "@/components/mission/health-badge";
import type { MissionHealth, MissionStatus, Priority } from "@/types";

interface MissionCardData {
  id: string;
  title: string;
  status: MissionStatus;
  health: MissionHealth;
  priority: Priority;
  progress: number;
  project: { key: string; color: string | null };
}

/**
 * Large, tappable mission card for Mission Control. Two clear actions: resume
 * (open the workspace) and the single primary CTA — Execute Mission.
 */
export function MissionControlCard({ mission }: { mission: MissionCardData }) {
  return (
    <Card className="group flex flex-col transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-semibold text-white"
              style={{ backgroundColor: mission.project.color ?? "#6366f1" }}
            >
              {mission.project.key.slice(0, 2)}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <StatusBadge status={mission.status} />
              <HealthBadge health={mission.health} />
            </div>
          </div>
          <PriorityBadge priority={mission.priority} />
        </div>

        <Link href={`/missions/${mission.id}`} className="flex-1">
          <h3 className="text-lg font-semibold leading-snug tracking-tight group-hover:text-primary">
            {mission.title}
          </h3>
        </Link>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{mission.progress}%</span>
          </div>
          <Progress value={mission.progress} />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/missions/${mission.id}/execute`}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            <Play className="h-4 w-4 fill-current" />
            Execute Mission
          </Link>
          <Link
            href={`/missions/${mission.id}`}
            className="inline-flex items-center justify-center gap-1 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
          >
            Resume
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export type { MissionCardData };
