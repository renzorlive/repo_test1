import type { Metadata } from "next";
import {
  FolderKanban,
  Target,
  Bot,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  mockMissions,
  mockAgents,
  mockActivity,
  mockProjects,
} from "@/lib/mock-data";
import { getInitials } from "@/lib/utils";

export const metadata: Metadata = { title: "Command Center" };

export default function CommandCenterPage() {
  const activeMissions = mockMissions.filter((m) => m.status === "ACTIVE");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        description="Your operational overview across projects, missions and agents."
        actions={<Button>New mission</Button>}
      />

      {/* KPI row */}
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active projects"
            value={mockProjects.filter((p) => p.status === "ACTIVE").length}
            icon={FolderKanban}
            trend={{ value: "+2 this month", positive: true }}
          />
          <StatCard
            label="Missions in flight"
            value={activeMissions.length}
            icon={Target}
            trend={{ value: "+5%", positive: true }}
          />
          <StatCard
            label="Agents online"
            value={mockAgents.filter((a) => a.status !== "DISABLED").length}
            icon={Bot}
          />
          <StatCard
            label="Tasks completed"
            value={128}
            icon={CheckCircle2}
            trend={{ value: "+18 this week", positive: true }}
          />
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Missions */}
        <FadeIn delay={0.05} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>Active missions</CardTitle>
                <CardDescription>
                  Progress across your highest-priority objectives.
                </CardDescription>
              </div>
              <Target className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-5">
              {activeMissions.map((mission) => (
                <div key={mission.id} className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{mission.title}</span>
                      <PriorityBadge priority={mission.priority} />
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {mission.progress}%
                    </span>
                  </div>
                  <Progress value={mission.progress} />
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Activity */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Recent activity</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              {mockActivity.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px]">
                      {getInitials(item.actor)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5 text-sm">
                    <p>
                      <span className="font-medium">{item.actor}</span>{" "}
                      <span className="text-muted-foreground">
                        {item.action}
                      </span>{" "}
                      <span className="font-medium">{item.target}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{item.at}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Agent fleet */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Agent fleet</CardTitle>
              <CardDescription>
                Specialized AI agents available in this workspace.
              </CardDescription>
            </div>
            <Bot className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockAgents.map((agent) => (
              <div
                key={agent.id}
                className="rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{agent.name}</span>
                  <StatusBadge status={agent.status} />
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {agent.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
