import { cn } from "@/lib/utils";
import type { MissionHealth } from "@/types";

const CONFIG: Record<
  MissionHealth,
  { label: string; dot: string; text: string }
> = {
  ON_TRACK: { label: "On track", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
  AT_RISK: { label: "At risk", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
  OFF_TRACK: { label: "Off track", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  BLOCKED: { label: "Blocked", dot: "bg-red-500", text: "text-red-600 dark:text-red-400" },
  UNKNOWN: { label: "Unknown", dot: "bg-zinc-400", text: "text-muted-foreground" },
};

export function HealthBadge({ health }: { health: MissionHealth }) {
  const config = CONFIG[health];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        config.text,
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
