import type { Metadata } from "next";
import { Inbox } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { InboxBoard } from "@/components/ai/inbox-board";
import { getActiveWorkspace } from "@/lib/active-workspace";
import { requireMembership, aiInboxService } from "@/server/services";
import { aiPolicy } from "@/server/policies/ai.policy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "AI Inbox" };

export default async function InboxPage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Inbox}
        title="No workspace yet"
        description="Create a workspace to triage AI executions."
      />
    );
  }

  const { membership } = await requireMembership(workspace.id);
  const data = await aiInboxService.get(workspace.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Inbox"
        description="Triage executions: approvals, failures, retries, cost and confidence."
      />
      <InboxBoard
        data={data}
        workspaceId={workspace.id}
        caps={{
          canApprove: aiPolicy.canApprove(membership.role),
          canRun: aiPolicy.canRun(membership.role),
        }}
      />
    </div>
  );
}
