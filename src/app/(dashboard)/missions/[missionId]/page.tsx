import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getActiveWorkspace } from "@/lib/active-workspace";
import {
  requireMembership,
  missionService,
  executionPlannerService,
} from "@/server/services";
import { missionPolicy } from "@/server/policies/mission.policy";
import { AppError } from "@/server/errors";
import { MissionWorkspace } from "@/components/mission/mission-workspace";

// The Mission Workspace reads live, request-scoped data through the service
// layer, so it must never be statically prerendered.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Mission" };

export default async function MissionWorkspacePage({
  params,
}: {
  params: Promise<{ missionId: string }>;
}) {
  const { missionId } = await params;

  const workspace = await getActiveWorkspace();
  if (!workspace) notFound();

  const { membership } = await requireMembership(workspace.id);

  try {
    const [mission, suggestions] = await Promise.all([
      missionService.getAggregate(workspace.id, missionId),
      executionPlannerService.suggestions(workspace.id, missionId),
    ]);
    const caps = {
      canEdit: missionPolicy.canEdit(membership.role),
      canApprove: missionPolicy.canApprove(membership.role),
      canContribute: missionPolicy.canContribute(membership.role),
    };
    return (
      <MissionWorkspace
        mission={mission}
        workspaceId={workspace.id}
        caps={caps}
        suggestions={suggestions}
      />
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  }
}
