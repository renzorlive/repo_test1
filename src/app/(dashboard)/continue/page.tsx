import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ContinueCommand } from "@/components/continue/continue-command";
import { getActiveWorkspace } from "@/lib/active-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Continue" };

export default async function ContinuePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No workspace yet"
        description="Create a workspace to continue a project."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Continue a project</h1>
        <p className="text-muted-foreground">
          Type one sentence. Get weeks of context back in seconds.
        </p>
      </div>
      <ContinueCommand workspaceId={workspace.id} />
    </div>
  );
}
