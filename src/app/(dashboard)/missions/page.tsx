import Link from "next/link";
import type { Metadata } from "next";
import { Target, ChevronRight, ListChecks, ShieldCheck, Bot } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { HealthBadge } from "@/components/mission/health-badge";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { missionService } from "@/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Missions" };

export default async function MissionsPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Target}
        title="No workspace yet"
        description="Create a workspace to start running missions."
      />
    );
  }

  const { items } = await missionService.listByWorkspace(workspace.id, {
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Missions"
        description="Business objectives that orchestrate epics, tasks, agents and approvals."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No missions yet"
          description="Missions are the source of truth for execution. Seed the database or create your first mission."
        />
      ) : (
        <div className="space-y-3">
          {items.map((mission, i) => (
            <FadeIn key={mission.id} delay={i * 0.03}>
              <Link href={`/missions/${mission.id}`}>
                <Card className="group transition-all hover:border-primary/40 hover:shadow-md">
                  <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {mission.project.key}
                        </Badge>
                        <StatusBadge status={mission.status} />
                        <HealthBadge health={mission.health} />
                        <PriorityBadge priority={mission.priority} />
                      </div>
                      <p className="truncate font-medium">{mission.title}</p>
                      {mission.summary && (
                        <p className="truncate text-sm text-muted-foreground">
                          {mission.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
                        <span className="flex items-center gap-1.5">
                          <ListChecks className="h-4 w-4" />
                          {mission._count.tasks}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4" />
                          {mission._count.approvals}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bot className="h-4 w-4" />
                          {mission._count.aiSessions}
                        </span>
                      </div>
                      <div className="flex w-32 items-center gap-2">
                        <Progress value={mission.progress} />
                        <span className="text-xs text-muted-foreground">
                          {mission.progress}%
                        </span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
