"use client";

import * as React from "react";
import { Check, ChevronDown, Circle, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { ActivityType } from "@/types";

const PHASES = [
  "Planning",
  "Architecture",
  "Implementation",
  "Testing",
  "Review",
  "Deploy",
  "Completed",
] as const;

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  createdAt: Date | string;
}

interface Props {
  status: string;
  progress: number;
  activities: ActivityItem[];
}

/**
 * Mission progress as a milestone ladder rather than a single percentage.
 * Phases derive from status + progress; each milestone expands into the slice
 * of execution history that happened during it.
 */
export function MissionMilestones({ status, progress, activities }: Props) {
  const completed = status === "COMPLETED";
  const activeIndex = completed
    ? PHASES.length - 1
    : Math.min(
        PHASES.length - 2,
        Math.floor(progress / (100 / (PHASES.length - 1))),
      );

  // Distribute history (oldest → newest) across the reached phases.
  const chronological = [...activities].reverse();
  const reached = activeIndex + 1;
  const buckets: ActivityItem[][] = Array.from({ length: PHASES.length }, () => []);
  chronological.forEach((activity, i) => {
    const phase = Math.min(reached - 1, Math.floor((i / Math.max(1, chronological.length)) * reached));
    buckets[phase]!.push(activity);
  });

  const [open, setOpen] = React.useState<number | null>(activeIndex);

  return (
    <ol className="space-y-2">
      {PHASES.map((phase, i) => {
        const state =
          completed || i < activeIndex
            ? "done"
            : i === activeIndex
              ? "active"
              : "upcoming";
        const items = buckets[i] ?? [];
        const expanded = open === i;

        return (
          <li key={phase} className="rounded-lg border">
            <button
              onClick={() => setOpen(expanded ? null : i)}
              className="flex w-full items-center gap-3 p-3 text-left"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                  state === "done" && "border-primary bg-primary text-primary-foreground",
                  state === "active" && "border-primary text-primary",
                  state === "upcoming" && "border-border text-muted-foreground",
                )}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : state === "active" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-3 w-3" />
                )}
              </span>
              <span
                className={cn(
                  "flex-1 text-sm font-medium",
                  state === "upcoming" && "text-muted-foreground",
                )}
              >
                {phase}
              </span>
              {items.length > 0 && (
                <span className="text-xs text-muted-foreground">{items.length}</span>
              )}
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform",
                  expanded && "rotate-180",
                )}
              />
            </button>

            {expanded && (
              <div className="border-t px-3 py-2 pl-12">
                {items.length === 0 ? (
                  <p className="py-1 text-xs text-muted-foreground">
                    No execution history in this phase yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {items.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="font-medium">{item.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
