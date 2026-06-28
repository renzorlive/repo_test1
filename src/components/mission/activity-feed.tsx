import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  CheckCircle2,
  CircleDot,
  FileText,
  Flag,
  GitBranch,
  Link2,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  Sparkles,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import type { ActivityType } from "@/types";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  actorName: string | null;
  createdAt: Date | string;
  actor: { name: string | null; image: string | null } | null;
}

const ICONS: Record<ActivityType, { icon: LucideIcon; tone: string }> = {
  MISSION_CREATED: { icon: Flag, tone: "text-primary" },
  MISSION_UPDATED: { icon: CircleDot, tone: "text-muted-foreground" },
  MISSION_STATUS_CHANGED: { icon: GitBranch, tone: "text-primary" },
  MISSION_HEALTH_CHANGED: { icon: Activity, tone: "text-amber-500" },
  MISSION_COMPLETED: { icon: CheckCircle2, tone: "text-emerald-500" },
  EPIC_CREATED: { icon: GitBranch, tone: "text-muted-foreground" },
  TASK_CREATED: { icon: CircleDot, tone: "text-muted-foreground" },
  TASK_COMPLETED: { icon: CheckCircle2, tone: "text-emerald-500" },
  DECISION_ADDED: { icon: FileText, tone: "text-primary" },
  ARTIFACT_UPLOADED: { icon: Link2, tone: "text-primary" },
  AI_SESSION_STARTED: { icon: Sparkles, tone: "text-violet-500" },
  AI_SESSION_COMPLETED: { icon: Bot, tone: "text-emerald-500" },
  AI_SESSION_FAILED: { icon: XCircle, tone: "text-red-500" },
  APPROVAL_REQUESTED: { icon: ShieldQuestion, tone: "text-amber-500" },
  APPROVAL_ACCEPTED: { icon: ShieldCheck, tone: "text-emerald-500" },
  APPROVAL_REJECTED: { icon: ShieldAlert, tone: "text-red-500" },
  APPROVAL_CHANGES_REQUESTED: { icon: ShieldAlert, tone: "text-amber-500" },
  REVIEW_FAILED: { icon: XCircle, tone: "text-red-500" },
  NOTE_ADDED: { icon: MessageSquare, tone: "text-muted-foreground" },
  DEPENDENCY_ADDED: { icon: Link2, tone: "text-muted-foreground" },
  METRIC_RECORDED: { icon: TrendingUp, tone: "text-primary" },
  EXECUTION_STARTED: { icon: Sparkles, tone: "text-violet-500" },
  EXECUTION_COMPLETED: { icon: Bot, tone: "text-emerald-500" },
};

/**
 * Append-only activity timeline. Presentational and source-agnostic so it
 * serves both the Mission Workspace and the dashboard feed. The connecting
 * rail + per-type iconography give it a command-center feel.
 */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No activity yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-5 before:absolute before:left-[15px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-border">
      {items.map((item) => {
        const { icon: Icon, tone } = ICONS[item.type];
        const who = item.actor?.name ?? item.actorName;
        return (
          <li key={item.id} className="relative flex gap-3">
            <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background">
              <Icon className={cn("h-4 w-4", tone)} />
            </span>
            <div className="flex-1 space-y-0.5 pt-1">
              <p className="text-sm font-medium leading-snug">{item.title}</p>
              {item.description && (
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {who ? `${who} · ` : ""}
                {formatRelativeTime(item.createdAt)}
              </p>
            </div>
            {who && (
              <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                {getInitials(who)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
