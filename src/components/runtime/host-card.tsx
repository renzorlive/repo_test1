import { Cpu, MemoryStick, MonitorSmartphone, Boxes, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HostStatusDot } from "./runtime-badges";
import { formatRelativeTime } from "@/lib/utils";
import type { RuntimeHostWithRuntimes } from "@/server/repositories";

/** A connected machine, with specs, health and its registered runtimes. */
export function HostCard({ host }: { host: RuntimeHostWithRuntimes }) {
  const connected = host.sessions.some((s) => s.status === "CONNECTED");
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MonitorSmartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold leading-tight">{host.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {host.hostname}
              </p>
            </div>
          </div>
          <HostStatusDot status={host.status} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <Spec icon={Boxes}>{host.os}</Spec>
          <Spec icon={Cpu}>
            {host.cpuCores} cores{host.cpuModel ? ` · ${host.cpuModel}` : ""}
          </Spec>
          <Spec icon={MemoryStick}>
            {(host.memoryMb / 1024).toFixed(0)} GB RAM
          </Spec>
          {host.gpu && <Spec icon={Zap}>{host.gpu}</Spec>}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {host.runtimes.map((runtime) => (
            <Badge key={runtime.id} variant="secondary" className="text-[10px]">
              {runtime.type.replace(/_/g, " ").toLowerCase()}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>
            {connected ? "Agent connected" : "Agent offline"}
            {host.agentVersion ? ` · v${host.agentVersion}` : ""}
          </span>
          <span>
            {host.lastSeenAt
              ? `seen ${formatRelativeTime(host.lastSeenAt)}`
              : "never seen"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Spec({
  icon: Icon,
  children,
}: {
  icon: typeof Cpu;
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{children}</span>
    </span>
  );
}
