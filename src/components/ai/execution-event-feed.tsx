import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Activity,
  Ban,
  CheckCircle2,
  Clock,
  Cpu,
  FileText,
  Layers,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  XCircle,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { AiExecutionEventType } from "@/types";

interface EventItem {
  id: string;
  type: AiExecutionEventType;
  message: string | null;
  createdAt: Date | string;
  execution: { id: string; title: string };
}

const ICONS: Record<AiExecutionEventType, { icon: LucideIcon; tone: string }> = {
  QUEUED: { icon: Clock, tone: "text-muted-foreground" },
  STARTED: { icon: Play, tone: "text-primary" },
  CONTEXT_READY: { icon: Layers, tone: "text-primary" },
  PROMPT_GENERATED: { icon: FileText, tone: "text-primary" },
  PROVIDER_SELECTED: { icon: Cpu, tone: "text-violet-500" },
  RUNNING: { icon: Activity, tone: "text-blue-500" },
  WAITING_APPROVAL: { icon: ShieldQuestion, tone: "text-amber-500" },
  APPROVED: { icon: ShieldCheck, tone: "text-emerald-500" },
  REJECTED: { icon: ShieldAlert, tone: "text-red-500" },
  COMPLETED: { icon: CheckCircle2, tone: "text-emerald-500" },
  FAILED: { icon: XCircle, tone: "text-red-500" },
  CANCELLED: { icon: Ban, tone: "text-muted-foreground" },
  RETRY_SCHEDULED: { icon: RefreshCw, tone: "text-amber-500" },
};

function humanize(type: AiExecutionEventType) {
  return type
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Workspace-wide execution event timeline (presentational). */
export function ExecutionEventFeed({
  events,
  linkToExecution = true,
}: {
  events: EventItem[];
  linkToExecution?: boolean;
}) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No execution events yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-4 before:absolute before:left-[13px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {events.map((event) => {
        const { icon: Icon, tone } = ICONS[event.type];
        return (
          <li key={event.id} className="relative flex gap-3">
            <span className="z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className={cn("h-3.5 w-3.5", tone)} />
            </span>
            <div className="flex-1 pt-0.5">
              <p className="text-sm">
                <span className="font-medium">{humanize(event.type)}</span>
                {event.message ? (
                  <span className="text-muted-foreground"> — {event.message}</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {linkToExecution ? (
                  <Link
                    href={`/orchestrator/executions/${event.execution.id}`}
                    className="hover:text-foreground hover:underline"
                  >
                    {event.execution.title}
                  </Link>
                ) : (
                  event.execution.title
                )}{" "}
                · {formatRelativeTime(event.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
