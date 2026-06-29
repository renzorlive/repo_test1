import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ResumeCommand } from "@/components/resume/resume-command";
import { getActiveWorkspace } from "@/lib/active-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const workspace = await getActiveWorkspace();
  if (!workspace) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No workspace yet"
        description="Create a workspace to resume your work."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Resume your work</h1>
        <p className="text-muted-foreground">
          One sentence — &ldquo;Resume GOCO&rdquo;, &ldquo;Resume yesterday&rdquo;
          — and re-enter your work state instantly.
        </p>
      </div>
      <ResumeCommand workspaceId={workspace.id} />
    </div>
  );
}
