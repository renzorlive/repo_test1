import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { mockMissions } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Missions" };

export default function MissionsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Missions"
        description="High-level objectives that orchestrate epics, tasks and agents."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New mission
          </Button>
        }
      />

      <FadeIn>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {/* Header row */}
              <div className="hidden grid-cols-12 gap-4 px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">
                <div className="col-span-5">Mission</div>
                <div className="col-span-2">Project</div>
                <div className="col-span-2">Priority</div>
                <div className="col-span-2">Progress</div>
                <div className="col-span-1 text-right">Status</div>
              </div>

              {mockMissions.map((mission) => (
                <div
                  key={mission.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-accent/40 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="col-span-5 space-y-0.5">
                    <p className="font-medium">{mission.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">
                      {mission.summary}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline" className="font-mono">
                      {mission.projectKey}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <PriorityBadge priority={mission.priority} />
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <Progress value={mission.progress} className="w-24" />
                    <span className="text-xs text-muted-foreground">
                      {mission.progress}%
                    </span>
                  </div>
                  <div className="col-span-1 flex items-center justify-between md:justify-end">
                    <StatusBadge status={mission.status} />
                    <span className="text-xs text-muted-foreground md:hidden">
                      due {formatRelativeTime(mission.dueDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
