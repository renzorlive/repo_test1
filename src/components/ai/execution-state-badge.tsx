import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AiExecutionState } from "@/types";

const CONFIG: Record<
  AiExecutionState,
  { label: string; variant: BadgeProps["variant"]; pulse?: boolean }
> = {
  QUEUED: { label: "Queued", variant: "secondary" },
  PREPARING: { label: "Preparing", variant: "default" },
  BUILDING_CONTEXT: { label: "Building context", variant: "default" },
  RUNNING: { label: "Running", variant: "default", pulse: true },
  WAITING_APPROVAL: { label: "Waiting approval", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  RETRYING: { label: "Retrying", variant: "warning" },
};

export function ExecutionStateBadge({ state }: { state: AiExecutionState }) {
  const config = CONFIG[state];
  return (
    <Badge variant={config.variant} className="gap-1.5">
      {config.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {config.label}
    </Badge>
  );
}

/** Small colored dot for worker health, reused in tables. */
export function WorkerHealthDot({ health }: { health: string }) {
  const tone =
    health === "HEALTHY"
      ? "bg-emerald-500"
      : health === "DEGRADED"
        ? "bg-amber-500"
        : health === "UNHEALTHY"
          ? "bg-red-500"
          : "bg-zinc-400";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn("h-2 w-2 rounded-full", tone)} />
      {health.charAt(0) + health.slice(1).toLowerCase()}
    </span>
  );
}
