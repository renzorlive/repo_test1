"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Mock workspaces until the workspace API is wired into the shell.
const workspaces = [
  { id: "ws_1", name: "RNZ HQ", initials: "RN" },
  { id: "ws_2", name: "Acme Agency", initials: "AA" },
];

export function WorkspaceSwitcher() {
  const [active, setActive] = React.useState(workspaces[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
          {active?.initials}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-semibold">{active?.name}</p>
          <p className="truncate text-xs text-muted-foreground">Workspace</p>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Workspaces
        </DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem key={ws.id} onClick={() => setActive(ws)}>
            <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-[10px] font-semibold">
              {ws.initials}
            </div>
            <span className="flex-1">{ws.name}</span>
            <Check
              className={cn(
                "h-4 w-4",
                active?.id === ws.id ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-muted-foreground">
          <Plus className="h-4 w-4" />
          New workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
