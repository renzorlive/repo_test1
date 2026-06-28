"use client";

import * as React from "react";
import { Check, MessageSquareWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/status-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMissionActions } from "@/hooks/use-mission-actions";
import { cn, formatRelativeTime, getInitials } from "@/lib/utils";
import type { ApprovalStatus } from "@/types";

interface ApprovalItem {
  id: string;
  title: string;
  description: string | null;
  status: ApprovalStatus;
  comment: string | null;
  createdAt: Date | string;
  reviewer: { name: string | null; image: string | null } | null;
  requestedBy: { name: string | null; image: string | null } | null;
}

interface Props {
  approvals: ApprovalItem[];
  workspaceId: string;
  missionId: string;
  canApprove: boolean;
  canContribute: boolean;
}

export function ApprovalsPanel({
  approvals,
  workspaceId,
  missionId,
  canApprove,
  canContribute,
}: Props) {
  const actions = useMissionActions(workspaceId, missionId);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    await actions.requestApproval({ title, description: description || undefined });
    setTitle("");
    setDescription("");
  }

  return (
    <div className="space-y-6">
      {canContribute && (
        <form
          onSubmit={submitRequest}
          className="space-y-3 rounded-lg border bg-muted/30 p-4"
        >
          <p className="text-sm font-medium">Request approval</p>
          <Input
            placeholder="What needs sign-off?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Add context for the reviewer (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={actions.pending}>
              Request approval
            </Button>
          </div>
        </form>
      )}

      {actions.error && (
        <p className="text-sm text-destructive">{actions.error}</p>
      )}

      {approvals.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No approvals requested yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {approvals.map((approval) => (
            <li key={approval.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{approval.title}</p>
                  {approval.description && (
                    <p className="text-sm text-muted-foreground">
                      {approval.description}
                    </p>
                  )}
                </div>
                <StatusBadge status={approval.status} />
              </div>

              {approval.comment && (
                <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
                  “{approval.comment}”
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {approval.requestedBy && (
                    <span className="flex items-center gap-1.5">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={approval.requestedBy.image ?? undefined}
                        />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(approval.requestedBy.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      requested {formatRelativeTime(approval.createdAt)}
                    </span>
                  )}
                </div>

                {canApprove && approval.status === "PENDING" && (
                  <div className="flex gap-1.5">
                    <ActionButton
                      tone="success"
                      icon={<Check className="h-4 w-4" />}
                      label="Approve"
                      disabled={actions.pending}
                      onClick={() =>
                        actions.decideApproval(approval.id, {
                          decision: "APPROVED",
                        })
                      }
                    />
                    <ActionButton
                      tone="warning"
                      icon={<MessageSquareWarning className="h-4 w-4" />}
                      label="Changes"
                      disabled={actions.pending}
                      onClick={() =>
                        actions.decideApproval(approval.id, {
                          decision: "CHANGES_REQUESTED",
                        })
                      }
                    />
                    <ActionButton
                      tone="danger"
                      icon={<X className="h-4 w-4" />}
                      label="Reject"
                      disabled={actions.pending}
                      onClick={() =>
                        actions.decideApproval(approval.id, {
                          decision: "REJECTED",
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionButton({
  tone,
  icon,
  label,
  disabled,
  onClick,
}: {
  tone: "success" | "warning" | "danger";
  icon: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const tones = {
    success:
      "border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400",
    warning:
      "border-amber-500/30 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400",
    danger:
      "border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400",
  } as const;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        tones[tone],
      )}
    >
      {icon}
      {label}
    </button>
  );
}
