"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  Loader2,
  FileText,
  GitBranch,
  ListChecks,
  Activity,
  Rocket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/status-badge";
import { HealthBadge } from "@/components/mission/health-badge";
import { ConfidencePanel } from "@/components/mission/confidence-panel";
import { apiClient } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/utils";
import type { ContinueRecall } from "@/server/services";
import type { MissionHealth } from "@/types";

/**
 * "Continue GOCO." — the product. One sentence, and weeks of context come back:
 * the project, where it left off, the decisions, the files, the next steps — and
 * a confidence score. This screen is the aha moment.
 */
export function ContinueCommand({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [sentence, setSentence] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [recall, setRecall] = React.useState<ContinueRecall | null>(null);

  async function run(value: string) {
    if (value.trim().length < 2) return;
    setPending(true);
    setError(null);
    setRecall(null);
    try {
      const data = await apiClient<ContinueRecall>(
        `/api/workspaces/${workspaceId}/continue`,
        { method: "POST", body: JSON.stringify({ sentence: value }) },
      );
      setRecall(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not recover context");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* The one input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(sentence);
        }}
        className="space-y-3"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
            <Input
              autoFocus
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Continue GOCO"
              className="h-14 pl-11 text-lg"
              disabled={pending}
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-6 text-base" disabled={pending}>
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            Continue
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          One sentence. RNZ OS remembers everything that matters.
        </p>
      </form>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      {pending && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Recovering context…
        </div>
      )}

      {recall && !pending && (
        <Recovered recall={recall} onContinue={(id) => router.push(`/missions/${id}`)} />
      )}
    </div>
  );
}

function Recovered({
  recall,
  onContinue,
}: {
  recall: ContinueRecall;
  onContinue: (missionId: string) => void;
}) {
  if (!recall.resolved || !recall.project) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">{recall.message}</p>
          <Button asChild variant="outline">
            <Link href="/command-center">Go to Mission Control</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero summary */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="space-y-3 p-6">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">{recall.project.key}</Badge>
            <span className="text-sm text-muted-foreground">context recovered</span>
          </div>
          <h2 className="text-xl font-semibold leading-snug">{recall.summary}</h2>
          {recall.mission && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={recall.mission.status} />
              <HealthBadge health={recall.mission.health as MissionHealth} />
              <div className="flex items-center gap-2">
                <Progress value={recall.mission.progress} className="w-28" />
                <span className="text-xs text-muted-foreground">{recall.mission.progress}%</span>
              </div>
            </div>
          )}
          {recall.mission && (
            <div className="pt-2">
              <Button size="lg" onClick={() => onContinue(recall.mission!.id)}>
                <Rocket className="h-4 w-4" />
                Continue {recall.project.name}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next steps */}
        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <ListChecks className="h-4 w-4 text-muted-foreground" />
              Proposed next steps
            </h3>
            <ol className="space-y-2">
              {recall.nextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            {recall.openTasks > 0 && (
              <p className="text-xs text-muted-foreground">{recall.openTasks} open task(s) remaining.</p>
            )}
          </CardContent>
        </Card>

        {/* Confidence */}
        {recall.confidence && <ConfidencePanel result={recall.confidence} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RecallList icon={GitBranch} title="Last decisions" empty="No decisions recorded.">
          {recall.lastDecisions.map((d, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{d.title}</span>
              {d.outcome && <span className="text-muted-foreground"> — {d.outcome}</span>}
            </li>
          ))}
        </RecallList>

        <RecallList icon={FileText} title="Relevant files" empty="No files yet.">
          {recall.recentFiles.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="truncate">{f.name}</span>
              <Badge variant="secondary" className="text-[10px]">{f.type}</Badge>
            </li>
          ))}
        </RecallList>

        <RecallList icon={Activity} title="What happened" empty="No activity yet.">
          {recall.recentActivity.map((a, i) => (
            <li key={i} className="text-sm">
              {a.title}
              <span className="ml-1 text-xs text-muted-foreground">· {formatRelativeTime(a.createdAt)}</span>
            </li>
          ))}
        </RecallList>
      </div>
    </div>
  );
}

function RecallList({
  icon: Icon,
  title,
  empty,
  children,
}: {
  icon: typeof FileText;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">{empty}</p>
        ) : (
          <ul className="space-y-1.5">{children}</ul>
        )}
      </CardContent>
    </Card>
  );
}
