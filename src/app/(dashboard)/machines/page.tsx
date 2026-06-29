import Link from "next/link";
import type { Metadata } from "next";
import {
  MonitorSmartphone,
  Server,
  Activity,
  ListChecks,
  Cpu,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { HostCard } from "@/components/runtime/host-card";
import { ConnectMachine } from "@/components/runtime/connect-machine";
import { RuntimeExecutionBadge } from "@/components/runtime/runtime-badges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { requireMembership, runtimeDashboardService } from "@/server/services";
import { runtimePolicy } from "@/server/policies/runtime.policy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Machines" };

export default async function MachinesPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={MonitorSmartphone}
        title="No workspace yet"
        description="Create a workspace to connect machines."
      />
    );
  }

  const { membership } = await requireMembership(workspace.id);
  const data = await runtimeDashboardService.getOverview(workspace.id);
  const canManage = runtimePolicy.canManage(membership.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Machines"
        description="Your distributed runtime — hosts running Claude Code and other workers."
      />

      {canManage && (
        <FadeIn>
          <ConnectMachine workspaceId={workspace.id} />
        </FadeIn>
      )}

      {/* Fleet KPIs */}
      <FadeIn delay={0.05}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Machines online"
            value={`${data.totals.onlineHosts}/${data.totals.hosts}`}
            icon={MonitorSmartphone}
          />
          <StatCard label="Runtimes" value={data.totals.runtimes} icon={Cpu} />
          <StatCard label="Running jobs" value={data.totals.running} icon={Activity} />
          <StatCard label="Queued" value={data.totals.queued} icon={ListChecks} />
        </div>
      </FadeIn>

      {/* Connected machines */}
      <FadeIn delay={0.1}>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Connected machines</h2>
          {data.hosts.length === 0 ? (
            <EmptyState
              icon={Server}
              title="No machines connected"
              description="Connect your laptop or home PC to run real work on Claude Code."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.hosts.map((host) => (
                <HostCard key={host.id} host={host} />
              ))}
            </div>
          )}
        </div>
      </FadeIn>

      {/* Current jobs */}
      <FadeIn delay={0.15}>
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Current jobs</CardTitle>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            {data.runningJobs.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No jobs running right now.
              </p>
            ) : (
              data.runningJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/machines/executions/${job.id}`}
                  className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-accent/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {job.command.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {job.host?.name ?? "Unassigned"}
                    </p>
                  </div>
                  <RuntimeExecutionBadge status={job.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
