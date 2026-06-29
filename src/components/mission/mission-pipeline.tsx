import type { LucideIcon } from "lucide-react";
import {
  ClipboardList,
  Blocks,
  ListTree,
  Bot,
  Play,
  ShieldCheck,
  Wrench,
  GitCommit,
  Rocket,
  FileText,
  Flag,
  Check,
  Loader2,
  Pause,
  Circle,
  Minus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MissionStageStatus, MissionStageType } from "@/types";

const STAGE: Record<MissionStageType, { label: string; icon: LucideIcon }> = {
  PLANNING: { label: "Planning", icon: ClipboardList },
  ARCHITECTURE: { label: "Architecture", icon: Blocks },
  TASK_BREAKDOWN: { label: "Task breakdown", icon: ListTree },
  WORKER_ASSIGNMENT: { label: "Assign workers", icon: Bot },
  EXECUTION: { label: "Execute", icon: Play },
  REVIEW: { label: "Review", icon: ShieldCheck },
  FIX: { label: "Fix", icon: Wrench },
  COMMIT: { label: "Commit", icon: GitCommit },
  DEPLOY: { label: "Deploy", icon: Rocket },
  RELEASE_NOTES: { label: "Release notes", icon: FileText },
  DONE: { label: "Done", icon: Flag },
};

interface StageItem {
  id: string;
  type: MissionStageType;
  title: string;
  status: MissionStageStatus;
}

function statusNode(status: MissionStageStatus) {
  switch (status) {
    case "COMPLETED":
      return { icon: Check, cls: "border-primary bg-primary text-primary-foreground" };
    case "ACTIVE":
      return { icon: Loader2, cls: "border-primary text-primary", spin: true };
    case "WAITING_APPROVAL":
      return { icon: Pause, cls: "border-amber-500 text-amber-500" };
    case "FAILED":
      return { icon: X, cls: "border-red-500 text-red-500" };
    case "SKIPPED":
      return { icon: Minus, cls: "border-border text-muted-foreground" };
    default:
      return { icon: Circle, cls: "border-border text-muted-foreground" };
  }
}

/** The Mission Brain's plan as a vertical pipeline (mobile-friendly). */
export function MissionPipeline({ stages }: { stages: StageItem[] }) {
  return (
    <ol className="relative space-y-1 before:absolute before:left-[15px] before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-border">
      {stages.map((stage) => {
        const meta = STAGE[stage.type];
        const node = statusNode(stage.status);
        const NodeIcon = node.icon;
        const active = stage.status === "ACTIVE" || stage.status === "WAITING_APPROVAL";
        return (
          <li
            key={stage.id}
            className={cn(
              "relative flex items-center gap-3 rounded-lg px-2 py-2",
              active && "bg-accent/50",
            )}
          >
            <span
              className={cn(
                "z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background",
                node.cls,
              )}
            >
              <NodeIcon className={cn("h-4 w-4", node.spin && "animate-spin")} />
            </span>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-sm font-medium",
                  stage.status === "PENDING" && "text-muted-foreground",
                  stage.status === "SKIPPED" && "text-muted-foreground line-through",
                )}
              >
                {meta.label}
              </p>
            </div>
            {stage.status === "WAITING_APPROVAL" && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                Needs you
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
