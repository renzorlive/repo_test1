import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveWorkspace } from "@/lib/active-workspace";
import {
  requireMembership,
  missionService,
  aiWorkerService,
  executionPlannerService,
} from "@/server/services";
import { aiPolicy } from "@/server/policies/ai.policy";
import { AppError } from "@/server/errors";
import { ExecutionWizard } from "@/components/execution/execution-wizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Execute Mission" };

export default async function ExecuteMissionPage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;
  const workspace = await getActiveWorkspace();
  if (!workspace) notFound();

  const { membership } = await requireMembership(workspace.id);

  try {
    const [mission, workers, suggestions] = await Promise.all([
      missionService.getAggregate(workspace.id, missionId),
      aiWorkerService.list(workspace.id),
      executionPlannerService.suggestions(workspace.id, missionId),
    ]);

    return (
      <ExecutionWizard
        mission={{
          id: mission.id,
          title: mission.title,
          summary: mission.summary,
          objective: mission.objective,
          background: mission.context?.background ?? null,
          openTasks: mission.tasks.filter((t) => t.status !== "DONE").length,
          projectKey: mission.project.key,
        }}
        workers={workers}
        suggestions={suggestions}
        workspaceId={workspace.id}
        caps={{
          canApprove: aiPolicy.canApprove(membership.role),
          canRun: aiPolicy.canRun(membership.role),
        }}
      />
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
