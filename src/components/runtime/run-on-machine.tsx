"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MonitorSmartphone, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRuntimeActions } from "@/hooks/use-runtime-actions";
import { HostStatusDot } from "./runtime-badges";
import type { HostStatus } from "@/types";

interface HostOption {
  id: string;
  name: string;
  status: HostStatus;
}

/**
 * Send this AI execution to one of the connected machines to run on Claude
 * Code. On dispatch we jump straight to the live terminal — the founder watches
 * the work happen on their own PC.
 */
export function RunOnMachine({
  workspaceId,
  aiExecutionId,
  hosts,
}: {
  workspaceId: string;
  aiExecutionId: string;
  hosts: HostOption[];
}) {
  const router = useRouter();
  const actions = useRuntimeActions(workspaceId);

  async function dispatch(hostId: string) {
    const result = await actions.dispatchAiExecution(aiExecutionId, hostId);
    if (result?.id) router.push(`/machines/executions/${result.id}`);
  }

  if (hosts.length === 0) {
    return (
      <Button asChild variant="outline">
        <Link href="/machines">
          <MonitorSmartphone className="h-4 w-4" />
          Connect a machine
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button disabled={actions.pending}>
          {actions.pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MonitorSmartphone className="h-4 w-4" />
          )}
          Run on machine
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Choose a machine
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hosts.map((host) => (
          <DropdownMenuItem
            key={host.id}
            onClick={() => dispatch(host.id)}
            className="flex items-center justify-between"
          >
            <span>{host.name}</span>
            <HostStatusDot status={host.status} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
