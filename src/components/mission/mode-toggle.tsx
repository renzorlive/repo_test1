"use client";

import { Sparkles, SlidersHorizontal } from "lucide-react";
import { useMissionBrain } from "@/hooks/use-mission-brain";
import { cn } from "@/lib/utils";
import type { MissionMode } from "@/types";

/**
 * Founder ⇄ Advanced. Founder hides all infrastructure; Advanced exposes every
 * execution detail. The mission remembers the choice.
 */
export function ModeToggle({
  workspaceId,
  missionId,
  mode,
}: {
  workspaceId: string;
  missionId: string;
  mode: MissionMode;
}) {
  const brain = useMissionBrain(workspaceId, missionId);

  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 text-sm">
      <button
        disabled={brain.pending}
        onClick={() => mode !== "FOUNDER" && brain.setMode("FOUNDER")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
          mode === "FOUNDER"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Founder
      </button>
      <button
        disabled={brain.pending}
        onClick={() => mode !== "ADVANCED" && brain.setMode("ADVANCED")}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
          mode === "ADVANCED"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Advanced
      </button>
    </div>
  );
}
