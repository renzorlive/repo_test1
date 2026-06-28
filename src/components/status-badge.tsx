import { Badge, type BadgeProps } from "@/components/ui/badge";

type Variant = BadgeProps["variant"];

// Maps domain statuses to a badge variant. Centralized so colors stay
// consistent everywhere a status is rendered.
const STATUS_VARIANT: Record<string, Variant> = {
  // Generic / active
  ACTIVE: "success",
  RUNNING: "success",
  DONE: "success",
  COMPLETED: "success",
  ACCEPTED: "success",
  // In flight
  IN_PROGRESS: "default",
  IN_REVIEW: "default",
  REVIEW: "default",
  PLANNING: "default",
  PROPOSED: "default",
  // Waiting / paused
  DRAFT: "secondary",
  BACKLOG: "secondary",
  TODO: "secondary",
  IDLE: "secondary",
  PAUSED: "warning",
  // Problem states
  BLOCKED: "danger",
  ERROR: "danger",
  CANCELLED: "danger",
  REJECTED: "danger",
  DISABLED: "secondary",
  ARCHIVED: "secondary",
};

const PRIORITY_VARIANT: Record<string, Variant> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "warning",
  URGENT: "danger",
};

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? "secondary"}>
      {humanize(status)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority] ?? "secondary"}>
      {humanize(priority)}
    </Badge>
  );
}
