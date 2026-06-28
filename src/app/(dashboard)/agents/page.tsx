import type { Metadata } from "next";
import { Plus, Play, Settings2, Zap } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { FadeIn } from "@/components/motion/fade-in";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { mockAgents } from "@/lib/mock-data";

export const metadata: Metadata = { title: "AI Agents" };

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Agents"
        description="Your fleet of specialized agents. Execution wiring lands in a later sprint."
        actions={
          <Button>
            <Plus className="h-4 w-4" />
            New agent
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAgents.map((agent, i) => (
          <FadeIn key={agent.id} delay={i * 0.05}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {agent.type}
                      </Badge>
                    </div>
                  </div>
                  <StatusBadge status={agent.status} />
                </div>
                <CardDescription className="line-clamp-2 pt-2">
                  {agent.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {agent.runs} runs
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Configure">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Play className="h-4 w-4" />
                    Run
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );
}
