"use client";

import * as React from "react";
import { Bot, Coins, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { useMissionActions } from "@/hooks/use-mission-actions";
import { formatRelativeTime } from "@/lib/utils";
import type { AiSessionStatus } from "@/types";

interface SessionItem {
  id: string;
  title: string;
  status: AiSessionStatus;
  model: string | null;
  summary: string | null;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: Date | string;
  agent: { name: string; type: string } | null;
}

interface Props {
  sessions: SessionItem[];
  workspaceId: string;
  missionId: string;
  canContribute: boolean;
}

export function AiSessionsPanel({
  sessions,
  workspaceId,
  missionId,
  canContribute,
}: Props) {
  const actions = useMissionActions(workspaceId, missionId);
  const [title, setTitle] = React.useState("");

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return;
    await actions.startSession({ title });
    setTitle("");
  }

  const totalCost = sessions.reduce((sum, s) => sum + s.cost, 0);

  return (
    <div className="space-y-5">
      {canContribute && (
        <form onSubmit={start} className="flex gap-2">
          <Input
            placeholder="Start an AI session (e.g. Decompose mission)…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button type="submit" disabled={actions.pending}>
            <Play className="h-4 w-4" />
            Start
          </Button>
        </form>
      )}

      {actions.error && (
        <p className="text-sm text-destructive">{actions.error}</p>
      )}

      {sessions.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Coins className="h-4 w-4" />
          Total session cost:{" "}
          <span className="font-medium text-foreground">
            ${totalCost.toFixed(2)}
          </span>
        </div>
      )}

      {sessions.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No AI sessions yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <li key={session.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium">{session.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.agent?.name ?? "Unassigned"} ·{" "}
                      {session.model ?? "no model"} ·{" "}
                      {formatRelativeTime(session.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={session.status} />
              </div>
              {session.summary && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {session.summary}
                </p>
              )}
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>{session.inputTokens.toLocaleString()} in</span>
                <span>{session.outputTokens.toLocaleString()} out</span>
                <span>${session.cost.toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
