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
  Target,
  Hammer,
  Ban,
  Clock,
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
import type { ResumePackage } from "@/server/services";
import type { MissionHealth } from "@/types";

const EXAMPLES = ["Resume GOCO", "Resume yesterday", "Resume the SEO campaign"];

/**
 * "Resume GOCO." The product. One sentence, and your work state comes back as a
 * structured Resume Package: the objective, what you were doing, what blocks
 * you, the decisions, the files, the one next action — plus confidence and how
 * long it should take to be productive again. This screen is the aha moment.
 */
export function ResumeCommand({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [sentence, setSentence] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pkg, setPkg] = React.useState<ResumePackage | null>(null);

  async function run(value: string) {
    if (value.trim().length < 2) return;
    setPending(true);
    setError(null);
    setPkg(null);
    try {
      const data = await apiClient<ResumePackage>(
        `/api/workspaces/${workspaceId}/resume`,
        { method: "POST", body: JSON.stringify({ sentence: value }) },
      );
      setPkg(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resume your work");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
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
              placeholder="Resume GOCO"
              className="h-14 pl-11 text-lg"
              disabled={pending}
            />
          </div>
          <Button type="submit" size="lg" className="h-14 px-6 text-base" disabled={pending}>
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            Resume
          </Button>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={pending}
              onClick={() => {
                setSentence(ex);
                void run(ex);
              }}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>

      {error && <p className="text-center text-sm text-destructive">{error}</p>}

      {pending && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Rebuilding your work state…
        </div>
      )}

      {pkg && !pending && (
        <ResumeView pkg={pkg} onResume={(id) => router.push(`/missions/${id}`)} />
      )}
    </div>
  );
}

function ResumeView({
  pkg,
  onResume,
}: {
  pkg: ResumePackage;
  onResume: (missionId: string) => void;
}) {
  if (!pkg.resolved || !pkg.project) {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <p className="text-sm text-muted-foreground">{pkg.message}</p>
          <Button asChild variant="outline">
            <Link href="/command-center">Go to Mission Control</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero: the Resume Package header */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">{pkg.project.key}</Badge>
            <span className="text-sm text-muted-foreground">work state recovered</span>
            {pkg.lastActive && (
              <span className="text-xs text-muted-foreground">
                · last active {formatRelativeTime(pkg.lastActive)}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold leading-snug">{pkg.summary}</h2>

          {pkg.mission && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <StatusBadge status={pkg.mission.status} />
              <HealthBadge health={pkg.mission.health as MissionHealth} />
              <div className="flex items-center gap-2">
                <Progress value={pkg.mission.progress} className="w-28" />
                <span className="text-xs text-muted-foreground">{pkg.mission.progress}%</span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {pkg.mission && (
              <Button size="lg" onClick={() => onResume(pkg.mission!.id)}>
                <Rocket className="h-4 w-4" />
                Resume {pkg.project.name}
              </Button>
            )}
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              ~{pkg.estimatedMinutesToResume} min to get back up to speed
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Objective + recommended next action */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            {pkg.currentObjective && (
              <Field icon={Target} title="Current objective">
                <p className="text-sm">{pkg.currentObjective}</p>
              </Field>
            )}
            <Field icon={ArrowRight} title="Recommended next action">
              <p className="text-sm font-medium text-primary">{pkg.recommendedNextAction}</p>
            </Field>
          </CardContent>
        </Card>

        {pkg.confidence && <ConfidencePanel result={pkg.confidence} />}
      </div>

      {/* You were doing / Blocked by */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard icon={Hammer} title="You were doing" empty="Nothing was in flight.">
          {pkg.youWereDoing.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ListCard>

        <ListCard icon={Ban} title="Blocked by" empty="Nothing is blocking you.">
          {pkg.blockedBy.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {item}
            </li>
          ))}
        </ListCard>
      </div>

      {/* Decisions + files */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ListCard icon={GitBranch} title="Recent decisions" empty="No decisions recorded.">
          {pkg.recentDecisions.map((d, i) => (
            <li key={i} className="text-sm">
              <span className="font-medium">{d.title}</span>
              {d.outcome && <span className="text-muted-foreground"> — {d.outcome}</span>}
            </li>
          ))}
        </ListCard>

        <ListCard icon={FileText} title="Relevant files" empty="No files yet.">
          {pkg.relevantFiles.map((f, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="truncate">{f.name}</span>
              <Badge variant="secondary" className="text-[10px]">{f.type}</Badge>
            </li>
          ))}
        </ListCard>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function ListCard({
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
