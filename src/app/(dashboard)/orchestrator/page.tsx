import type { Metadata } from "next";
import {
  Cpu,
  ListChecks,
  CheckCircle2,
  Timer,
  Coins,
  Server,
  Bot,
  Activity,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { WorkerRegistry } from "@/components/ai/worker-registry";
import { ExecutionEventFeed } from "@/components/ai/execution-event-feed";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { aiDashboardService, aiWorkerService } from "@/server/services";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "AI Orchestrator" };

function formatRuntime(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default async function OrchestratorPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Cpu}
        title="No workspace yet"
        description="Create a workspace to run the AI Orchestrator."
      />
    );
  }

  const [data, workers] = await Promise.all([
    aiDashboardService.getOverview(workspace.id),
    aiWorkerService.list(workspace.id),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Orchestrator"
        description="Kubernetes for AI workers — registry, scheduling and execution metrics."
      />

      {/* KPIs */}
      <FadeIn>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Running workers" value={data.counts.runningWorkers} icon={Server} />
          <StatCard label="Queued jobs" value={data.counts.queuedJobs} icon={ListChecks} />
          <StatCard
            label="Success rate"
            value={`${Math.round(data.successRate)}%`}
            icon={CheckCircle2}
          />
          <StatCard label="Avg runtime" value={formatRuntime(data.avgRuntimeMs)} icon={Timer} />
          <StatCard
            label="Daily cost"
            value={`$${data.dailyCost.toFixed(2)}`}
            icon={Coins}
          />
        </div>
      </FadeIn>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top providers */}
        <FadeIn delay={0.05}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Top providers</CardTitle>
              <Cpu className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topProviders.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No executions yet.
                </p>
              ) : (
                data.topProviders.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.type}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {p.executions}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Top workers */}
        <FadeIn delay={0.1}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Top workers</CardTitle>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {data.topWorkers.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No executions yet.
                </p>
              ) : (
                data.topWorkers.map((w) => (
                  <div key={w.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{w.name}</span>
                      <span className="text-xs text-muted-foreground">{w.role}</span>
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {w.executions}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Execution timeline */}
        <FadeIn delay={0.15}>
          <Card className="h-full">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Execution timeline</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ExecutionEventFeed events={data.recentEvents} />
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Worker Registry */}
      <FadeIn delay={0.1}>
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Worker Registry</h2>
            <CardDescription>
              Every schedulable worker, with provider, health, pricing and capacity.
            </CardDescription>
          </div>
          <WorkerRegistry workers={workers} />
        </div>
      </FadeIn>
    </div>
  );
}
