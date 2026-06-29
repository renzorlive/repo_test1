import Link from "next/link";
import type { Metadata } from "next";
import {
  Target,
  Activity,
  CheckCircle2,
  Coins,
  Cpu,
  ShieldCheck,
  CalendarClock,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/empty-state";
import { MissionControlCard } from "@/components/mission-control/mission-card";
import { ExecutionStateBadge } from "@/components/ai/execution-state-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { missionControlService } from "@/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mission Control" };

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function MissionControlPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Target}
        title="No workspace yet"
        description="Create a workspace to open Mission Control."
      />
    );
  }

  const data = await missionControlService.get(workspace.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mission Control"
        description="Resume a mission, launch an execution, and clear what needs you."
      />

      {/* Today's progress */}
      <FadeIn>
        <div className="grid grid-cols-3 gap-3">
          <ProgressChip
            icon={Activity}
            label="Updates today"
            value={data.todayProgress.activities}
          />
          <ProgressChip
            icon={CheckCircle2}
            label="Runs completed"
            value={data.todayProgress.executionsCompleted}
          />
          <ProgressChip
            icon={Coins}
            label="Spent today"
            value={`$${data.todayProgress.cost.toFixed(2)}`}
          />
        </div>
      </FadeIn>

      {/* Resume a mission — large cards */}
      <FadeIn delay={0.05}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Resume a mission</h2>
          {data.missions.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No active missions"
              description="Activate a mission to start running executions."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.missions.map((mission) => (
                <MissionControlCard key={mission.id} mission={mission} />
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Running executions */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Running executions</CardTitle>
              <Cpu className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.runningExecutions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing running right now.
                </p>
              ) : (
                data.runningExecutions.map((exec) => (
                  <Link
                    key={exec.id}
                    href={`/orchestrator/executions/${exec.id}`}
                    className="block space-y-1 rounded-md p-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {exec.title}
                      </span>
                      <ExecutionStateBadge state={exec.state} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {exec.worker?.name ?? "Scheduling…"}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Approvals */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Approvals</CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.approvals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing waiting on you.
                </p>
              ) : (
                data.approvals.map((approval) => (
                  <Link
                    key={approval.id}
                    href={`/missions/${approval.mission.id}`}
                    className="block space-y-1 rounded-md p-2 transition-colors hover:bg-accent/50"
                  >
                    <p className="truncate text-sm font-medium">{approval.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {approval.mission.title}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Weekly goals */}
        <FadeIn delay={0.15}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>This week</CardTitle>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.weeklyGoals.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No missions due this week.
                </p>
              ) : (
                data.weeklyGoals.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="block space-y-1.5 rounded-md p-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {mission.title}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(mission.dueDate)}
                      </span>
                    </div>
                    <Progress value={mission.progress} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}

function ProgressChip({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-1 p-4 text-center sm:flex-row sm:gap-3 sm:text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
