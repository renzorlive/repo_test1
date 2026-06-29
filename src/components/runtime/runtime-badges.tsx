import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HostStatus, RuntimeExecutionStatus } from "@/types";

const EXEC: Record<
  RuntimeExecutionStatus,
  { label: string; variant: BadgeProps["variant"]; pulse?: boolean }
> = {
  PENDING: { label: "Pending", variant: "secondary" },
  DISPATCHED: { label: "Dispatched", variant: "default" },
  RUNNING: { label: "Running", variant: "default", pulse: true },
  SUCCEEDED: { label: "Succeeded", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
  CANCELLED: { label: "Cancelled", variant: "secondary" },
  TIMED_OUT: { label: "Timed out", variant: "danger" },
};

export function RuntimeExecutionBadge({
  status,
}: {
  status: RuntimeExecutionStatus;
}) {
  const c = EXEC[status];
  return (
    <Badge variant={c.variant} className="gap-1.5">
      {c.pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {c.label}
    </Badge>
  );
}

const HOST_TONE: Record<HostStatus, string> = {
  ONLINE: "bg-emerald-500",
  BUSY: "bg-amber-500",
  OFFLINE: "bg-zinc-400",
  UNREACHABLE: "bg-red-500",
};

export function HostStatusDot({ status }: { status: HostStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          HOST_TONE[status],
          status === "ONLINE" && "animate-pulse",
        )}
      />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}
