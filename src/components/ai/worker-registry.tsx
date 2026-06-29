import { Cpu } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { WorkerHealthDot } from "./execution-state-badge";
import { formatRelativeTime } from "@/lib/utils";

interface WorkerRow {
  id: string;
  name: string;
  role: string;
  status: string;
  health: string;
  contextWindow: number;
  maxTokens: number;
  inputCostPer1k: number;
  outputCostPer1k: number;
  priority: number;
  concurrency: number;
  version: string;
  lastSeenAt: Date | string | null;
  provider: { name: string; type: string };
  model: { label: string };
  capabilities: { kind: string }[];
  _count: { executions: number };
}

/**
 * Worker Registry table. Presentational and server-rendered — surfaces every
 * registry attribute the scheduler reasons over (provider/model, status,
 * health, pricing, priority, concurrency, context window, version, last seen).
 */
export function WorkerRegistry({ workers }: { workers: WorkerRow[] }) {
  if (workers.length === 0) {
    return (
      <EmptyState
        icon={Cpu}
        title="No workers registered"
        description="Register AI workers (provider + model + capabilities) to schedule executions."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border scrollbar-thin">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Worker</th>
            <th className="px-4 py-3 font-medium">Provider / Model</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Health</th>
            <th className="px-4 py-3 font-medium">Context</th>
            <th className="px-4 py-3 font-medium">Pricing /1k</th>
            <th className="px-4 py-3 font-medium">Prio · Conc</th>
            <th className="px-4 py-3 font-medium">Runs</th>
            <th className="px-4 py-3 font-medium">Last seen</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {workers.map((worker) => (
            <tr key={worker.id} className="transition-colors hover:bg-accent/30">
              <td className="px-4 py-3">
                <div className="font-medium">{worker.name}</div>
                <div className="text-xs text-muted-foreground">
                  {worker.role} · v{worker.version}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {worker.capabilities.slice(0, 3).map((c) => (
                    <Badge key={c.kind} variant="secondary" className="text-[10px]">
                      {c.kind.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">
                <div>{worker.provider.name}</div>
                <div className="text-xs text-muted-foreground">
                  {worker.model.label}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={worker.status} />
              </td>
              <td className="px-4 py-3">
                <WorkerHealthDot health={worker.health} />
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {worker.contextWindow.toLocaleString()} ctx
                <br />
                {worker.maxTokens.toLocaleString()} out
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                ${worker.inputCostPer1k.toFixed(3)} in
                <br />${worker.outputCostPer1k.toFixed(3)} out
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {worker.priority} · {worker.concurrency}×
              </td>
              <td className="px-4 py-3 tabular-nums">{worker._count.executions}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {worker.lastSeenAt ? formatRelativeTime(worker.lastSeenAt) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
