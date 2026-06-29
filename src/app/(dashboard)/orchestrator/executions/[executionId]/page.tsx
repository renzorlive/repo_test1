import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Coins, Hash, Cpu } from "lucide-react";
import { getActiveWorkspace } from "@/lib/active-workspace";
import {
  requireMembership,
  aiExecutionService,
  runtimeHostService,
} from "@/server/services";
import { aiPolicy } from "@/server/policies/ai.policy";
import { runtimePolicy } from "@/server/policies/runtime.policy";
import { AppError } from "@/server/errors";
import { RunOnMachine } from "@/components/runtime/run-on-machine";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExecutionStateBadge } from "@/components/ai/execution-state-badge";
import { ExecutionEventFeed } from "@/components/ai/execution-event-feed";
import { ExecutionActions } from "@/components/ai/execution-actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Execution" };

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export default async function ExecutionDetailPage({
  params,
}: {
  params: Promise<{ executionId: string }>;
}) {
  const { executionId } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) notFound();

  const { membership } = await requireMembership(workspace.id);

  try {
    const exec = await aiExecutionService.getAggregate(workspace.id, executionId);
    const latestPrompt = exec.prompts[0];
    const canOperateRuntime = runtimePolicy.canOperate(membership.role);
    const hosts = canOperateRuntime
      ? await runtimeHostService.list(workspace.id)
      : [];

    return (
      <div className="space-y-6">
        <Link
          href="/orchestrator"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Orchestrator
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <ExecutionStateBadge state={exec.state} />
              {exec.worker && (
                <Badge variant="secondary">
                  <Cpu className="mr-1 h-3 w-3" />
                  {exec.worker.name}
                </Badge>
              )}
              <Badge variant="outline">
                attempt {exec.attempt}/{exec.maxAttempts}
              </Badge>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{exec.title}</h1>
            {exec.mission && (
              <p className="text-sm text-muted-foreground">
                Mission:{" "}
                <Link href={`/missions/${exec.mission.id}`} className="hover:underline">
                  {exec.mission.title}
                </Link>
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canOperateRuntime && (
              <RunOnMachine
                workspaceId={workspace.id}
                aiExecutionId={exec.id}
                hosts={hosts.map((h) => ({
                  id: h.id,
                  name: h.name,
                  status: h.status,
                }))}
              />
            )}
            <ExecutionActions
              workspaceId={workspace.id}
              executionId={exec.id}
              state={exec.state}
              canApprove={aiPolicy.canApprove(membership.role)}
              canRun={aiPolicy.canRun(membership.role)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Coins className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Cost</p>
                <p className="font-semibold">
                  ${exec.cost ? exec.cost.totalCost.toFixed(4) : "0.0000"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Hash className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Tokens</p>
                <p className="font-semibold">
                  {exec.usage ? exec.usage.totalTokens.toLocaleString() : 0}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Cpu className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Provider / Model</p>
                <p className="font-semibold">
                  {exec.worker
                    ? `${exec.worker.provider.name} · ${exec.worker.model.label}`
                    : "Unassigned"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Execution timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ExecutionEventFeed
                events={exec.events.map((e) => ({
                  id: e.id,
                  type: e.type,
                  message: e.message,
                  createdAt: e.createdAt,
                  execution: { id: exec.id, title: exec.title },
                }))}
                linkToExecution={false}
              />
            </CardContent>
          </Card>

          {/* Result / prompt */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                {exec.result?.content ? (
                  <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">
                    {exec.result.content}
                  </pre>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No result yet — awaiting a worker callback.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  Prompt {latestPrompt ? `v${latestPrompt.version}` : ""}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {latestPrompt ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {latestPrompt.tokensEstimated.toLocaleString()} est. tokens ·
                      hash {latestPrompt.hash.slice(0, 12)}
                    </p>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs scrollbar-thin">
                      {latestPrompt.systemInstructions}
                    </pre>
                  </>
                ) : (
                  <p className="text-muted-foreground">No prompt generated yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logs */}
        {exec.logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1 font-mono text-xs">
                {exec.logs.map((logLine) => (
                  <li key={logLine.id} className="flex gap-2">
                    <span className="shrink-0 text-muted-foreground">
                      {formatDate(logLine.createdAt)}
                    </span>
                    <span className="shrink-0 font-semibold">[{logLine.level}]</span>
                    <span>{logLine.message}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
