"use client";

import * as React from "react";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useMissionActions } from "@/hooks/use-mission-actions";
import { formatRelativeTime, getInitials } from "@/lib/utils";

interface NoteItem {
  id: string;
  body: string;
  pinned: boolean;
  createdAt: Date | string;
  author: { name: string | null; image: string | null } | null;
}

interface Props {
  notes: NoteItem[];
  workspaceId: string;
  missionId: string;
  canContribute: boolean;
}

export function NotesPanel({
  notes,
  workspaceId,
  missionId,
  canContribute,
}: Props) {
  const actions = useMissionActions(workspaceId, missionId);
  const [body, setBody] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length === 0) return;
    await actions.addNote({ body, pinned: false });
    setBody("");
  }

  return (
    <div className="space-y-5">
      {canContribute && (
        <form onSubmit={submit} className="space-y-3">
          <Textarea
            placeholder="Add a note for the mission…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={actions.pending}>
              Add note
            </Button>
          </div>
        </form>
      )}

      {actions.error && (
        <p className="text-sm text-destructive">{actions.error}</p>
      )}

      {notes.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No notes yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={note.author?.image ?? undefined} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(note.author?.name ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    {note.pinned && <Pin className="h-3 w-3" />}
                    {note.author?.name ?? "Unknown"} ·{" "}
                    {formatRelativeTime(note.createdAt)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
