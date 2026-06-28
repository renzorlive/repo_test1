import Link from "next/link";
import type { Metadata } from "next";
import {
  Target,
  ShieldCheck,
  Bot,
  Ban,
  Activity,
  CalendarClock,
  TrendingUp,
  HeartPulse,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityFeed } from "@/components/mission/activity-feed";
import { HealthBadge } from "@/components/mission/health-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { dashboardService } from "@/server/services";
import type { MissionHealth } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Command Center" };

const HEALTH_ORDER: MissionHealth[] = [
  "ON_TRACK",
  "AT_RISK",
  "OFF_TRACK",
  "BLOCKED",
  "UNKNOWN",
];

const HEALTH_BAR: Record<MissionHealth, string> = {
  ON_TRACK: "bg-emerald-500",
  AT_RISK: "bg-amber-500",
  OFF_TRACK: "bg-red-500",
  BLOCKED: "bg-red-500",
  UNKNOWN: "bg-zinc-400",
};

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function CommandCenterPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Target}
        title="No workspace yet"
        description="Create a workspace to see your command center."
      />
    );
  }

  const data = await dashboardService.getOverview(workspace.id);
  const healthTotal = HEALTH_ORDER.reduce(
    (sum, key) => sum + data.health[key],
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        description="Live operational overview of missions, approvals and AI execution."
      />

      {/* KPIs */}
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Active missions" value={data.counts.activeMissions} icon={Target} />
          <StatCard label="Approvals waiting" value={data.counts.pendingApprovals} icon={ShieldCheck} />
          <StatCard label="AI sessions running" value={data.counts.activeAiSessions} icon={Bot} />
          <StatCard label="Blocked missions" value={data.counts.blockedMissions} icon={Ban} />
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Mission progress */}
        <FadeIn delay={0.05} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Mission progress</CardTitle>
                <CardDescription>Active and blocked missions by priority.</CardDescription>
              </div>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {data.missions.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No active missions.
                </p>
              ) : (
                data.missions.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="block space-y-2 rounded-lg p-2 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <Badge variant="outline" className="font-mono">
                          {mission.project.key}
                        </Badge>
                        <span className="truncate text-sm font-medium">
                          {mission.title}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <HealthBadge health={mission.health} />
                        <span className="text-sm text-muted-foreground">
                          {mission.progress}%
                        </span>
                      </div>
                    </div>
                    <Progress value={mission.progress} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Mission health */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Mission health</CardTitle>
              <HeartPulse className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {healthTotal === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No missions in flight.
                </p>
              ) : (
                HEALTH_ORDER.map((key) => {
                  const count = data.health[key];
                  const pct = healthTotal > 0 ? (count / healthTotal) * 100 : 0;
                  return (
                    <div key={key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <HealthBadge health={key} />
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full ${HEALTH_BAR[key]}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming deadlines */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Upcoming deadlines</CardTitle>
              <CalendarClock className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.upcomingDeadlines.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nothing due soon.
                </p>
              ) : (
                data.upcomingDeadlines.map((mission) => (
                  <Link
                    key={mission.id}
                    href={`/missions/${mission.id}`}
                    className="flex items-center justify-between rounded-md p-2 text-sm transition-colors hover:bg-accent/50"
                  >
                    <span className="truncate">{mission.title}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatDate(mission.dueDate)}
                    </span>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Approvals waiting */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Approvals waiting</CardTitle>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.approvalsWaiting.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No approvals pending.
                </p>
              ) : (
                data.approvalsWaiting.map((approval) => (
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

        {/* AI sessions */}
        <FadeIn delay={0.15}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>AI sessions</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.aiSessions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No running sessions.
                </p>
              ) : (
                data.aiSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/missions/${session.mission.id}`}
                    className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50"
                  >
                    <span className="truncate text-sm">{session.title}</span>
                    <StatusBadge status={session.status} />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Recent activity */}
      <FadeIn delay={0.1}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>The latest events across every mission.</CardDescription>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ActivityFeed items={data.recentActivity} />
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
