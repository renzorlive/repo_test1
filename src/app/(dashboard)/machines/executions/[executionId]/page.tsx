import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MonitorSmartphone, Sparkles } from "lucide-react";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { requireMembership, runtimeExecutionService } from "@/server/services";
import { runtimePolicy } from "@/server/policies/runtime.policy";
import { AppError } from "@/server/errors";
import { Badge } from "@/components/ui/badge";
import { RuntimeExecutionView } from "@/components/runtime/runtime-execution-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Runtime job" };

export default async function RuntimeExecutionPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) notFound();

  const { membership } = await requireMembership(workspace.id);

  try {
    const execution = await runtimeExecutionService.getAggregate(
      workspace.id,
      executionId,
    );

    return (
      <div className="space-y-6">
        <Link
          href="/machines"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Machines
        </Link>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            {execution.host && (
              <Badge variant="secondary">
                <MonitorSmartphone className="mr-1 h-3 w-3" />
                {execution.host.name}
              </Badge>
            )}
            {execution.runtime && (
              <Badge variant="outline">
                {execution.runtime.type.replace(/_/g, " ").toLowerCase()}
              </Badge>
            )}
            {execution.aiExecution && (
              <Link href={`/orchestrator/executions/${execution.aiExecution.id}`}>
                <Badge variant="default" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {execution.aiExecution.title}
                </Badge>
              </Link>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {execution.command.name}
          </h1>
        </div>

        <RuntimeExecutionView
          workspaceId={workspace.id}
          executionId={execution.id}
          canOperate={runtimePolicy.canOperate(membership.role)}
          initial={execution}
        />
      </div>
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
