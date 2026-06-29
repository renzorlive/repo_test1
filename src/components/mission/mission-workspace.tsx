"use client";

import * as React from "react";
import {
  Target,
  Flag,
  TrendingUp,
  CalendarClock,
  GitBranch,
  ListChecks,
  FileText,
  Paperclip,
  ShieldCheck,
  Bot,
  BarChart3,
  Link2,
  MessageSquare,
  Activity as ActivityIcon,
  Clock,
  Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { FadeIn } from "@/components/motion/fade-in";
import { MissionHeader } from "./mission-header";
import { HealthBadge } from "./health-badge";
import { ActivityFeed } from "./activity-feed";
import { ApprovalsPanel } from "./approvals-panel";
import { NotesPanel } from "./notes-panel";
import { AiSessionsPanel } from "./ai-sessions-panel";
import { MissionMilestones } from "./mission-milestones";
import { MissionSuggestionsPanel } from "./mission-suggestions";
import type { MissionAggregate } from "@/server/repositories";
import type { MissionSuggestions } from "@/server/services";

export type MissionAggregateView = MissionAggregate;

export interface MissionCapabilities {
  canEdit: boolean;
  canApprove: boolean;
  canContribute: boolean;
}

interface Props {
  mission: MissionAggregateView;
  workspaceId: string;
  caps: MissionCapabilities;
  suggestions: MissionSuggestions;
}

const TABS = [
  { value: "overview", label: "Overview", icon: Target },
  { value: "objectives", label: "Objectives", icon: Flag },
  { value: "progress", label: "Progress", icon: TrendingUp },
  { value: "timeline", label: "Timeline", icon: CalendarClock },
  { value: "epics", label: "Epics", icon: GitBranch },
  { value: "tasks", label: "Tasks", icon: ListChecks },
  { value: "artifacts", label: "Artifacts", icon: Paperclip },
  { value: "decisions", label: "Decisions", icon: FileText },
  { value: "approvals", label: "Approvals", icon: ShieldCheck },
  { value: "sessions", label: "AI Sessions", icon: Bot },
  { value: "metrics", label: "Metrics", icon: BarChart3 },
  { value: "dependencies", label: "Dependencies", icon: Link2 },
  { value: "notes", label: "Notes", icon: MessageSquare },
  { value: "activity", label: "Activity", icon: ActivityIcon },
] as const;

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function asReferences(value: unknown): { label: string; url: string }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((v) =>
    v && typeof v === "object" && "url" in v && "label" in v
      ? [{ label: String((v as Record<string, unknown>).label), url: String((v as Record<string, unknown>).url) }]
      : [],
  );
}

export function MissionWorkspace({
  mission,
  workspaceId,
  caps,
  suggestions,
}: Props) {
  const { tasks } = mission;
  const tasksByStatus = React.useMemo(() => {
    const groups: Record<string, typeof tasks> = {};
    for (const task of tasks) {
      (groups[task.status] ??= []).push(task);
    }
    return groups;
  }, [tasks]);

  return (
    <div className="space-y-6">
      <MissionHeader
        mission={mission}
        workspaceId={workspaceId}
        canEdit={caps.canEdit}
      />

      <Tabs defaultValue="overview">
        <div className="-mx-1 overflow-x-auto scrollbar-thin">
          <TabsList className="h-auto flex-nowrap justify-start">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-1.5 whitespace-nowrap"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Overview */}
        <TabsContent value="overview">
          <FadeIn>
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="space-y-4 p-6">
                  <SectionTitle icon={Target}>Mission brief</SectionTitle>
                  <Field label="Objective" value={mission.objective} />
                  <Field label="Summary" value={mission.summary} />
                  <Field label="Outcome" value={mission.outcome} />
                  {mission.context && (
                    <div className="space-y-3 border-t pt-4">
                      <Field label="Background" value={mission.context.background} />
                      <ListField label="Constraints" items={asStringArray(mission.context.constraints)} />
                      <ListField label="Assumptions" items={asStringArray(mission.context.assumptions)} />
                      <ReferencesField items={asReferences(mission.context.references)} />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="space-y-4 p-6">
                  <SectionTitle icon={ActivityIcon}>Snapshot</SectionTitle>
                  <InfoRow label="Status"><StatusBadge status={mission.status} /></InfoRow>
                  <InfoRow label="Health"><HealthBadge health={mission.health} /></InfoRow>
                  <InfoRow label="Priority"><PriorityBadge priority={mission.priority} /></InfoRow>
                  <InfoRow label="Owner">
                    <span className="text-sm">{mission.owner?.name ?? "Unassigned"}</span>
                  </InfoRow>
                  <InfoRow label="Started">
                    <span className="text-sm">{formatDate(mission.startedAt)}</span>
                  </InfoRow>
                  <InfoRow label="Due">
                    <span className="text-sm">{formatDate(mission.dueDate)}</span>
                  </InfoRow>
                  <InfoRow label="Completed">
                    <span className="text-sm">{formatDate(mission.completedAt)}</span>
                  </InfoRow>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
          <FadeIn delay={0.08} className="mt-4">
            <MissionSuggestionsPanel suggestions={suggestions} />
          </FadeIn>
        </TabsContent>

        {/* Objectives */}
        <TabsContent value="objectives">
          <SectionCard icon={Flag} title="Objective & outcome">
            <Field label="Business objective" value={mission.objective} />
            <Field label="Definition of done / outcome" value={mission.outcome} />
          </SectionCard>
        </TabsContent>

        {/* Progress */}
        <TabsContent value="progress">
          <FadeIn>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-3">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <SectionTitle icon={TrendingUp}>Milestones</SectionTitle>
                    <span className="text-sm text-muted-foreground">
                      {mission.progress}% complete
                    </span>
                  </div>
                  <MissionMilestones
                    status={mission.status}
                    progress={mission.progress}
                    activities={mission.activities}
                  />
                </CardContent>
              </Card>
              <EnvelopeCard icon={Clock} label="Hours" actual={mission.actualHours} estimate={mission.estimatedHours} unit="h" />
              <EnvelopeCard icon={Coins} label="Cost" actual={mission.actualCost} estimate={mission.estimatedCost} unit="$" prefix />
              <Card>
                <CardContent className="space-y-2 p-6">
                  <SectionTitle icon={BarChart3}>Latest metrics</SectionTitle>
                  {mission.metrics.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{m.label}</span>
                      <span className="font-medium">{m.value}{m.unit}</span>
                    </div>
                  ))}
                  {mission.metrics.length === 0 && <Empty>No metrics</Empty>}
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </TabsContent>

        {/* Timeline (milestones) */}
        <TabsContent value="timeline">
          <SectionCard icon={CalendarClock} title="Milestones">
            {mission.milestones.length === 0 ? (
              <Empty>No milestones planned.</Empty>
            ) : (
              <ol className="space-y-3">
                {mission.milestones.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={m.status} />
                      <div>
                        <p className="text-sm font-medium">{m.title}</p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(m.startsAt)} → {formatDate(m.endsAt)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </SectionCard>
        </TabsContent>

        {/* Epics */}
        <TabsContent value="epics">
          <SectionCard icon={GitBranch} title="Epics">
            {mission.epics.length === 0 ? (
              <Empty>No epics yet.</Empty>
            ) : (
              <ul className="divide-y">
                {mission.epics.map((epic) => (
                  <li key={epic.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={epic.status} />
                      <span className="text-sm font-medium">{epic.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {epic._count.tasks} tasks
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <SectionCard icon={ListChecks} title="Tasks">
            {mission.tasks.length === 0 ? (
              <Empty>No tasks yet.</Empty>
            ) : (
              <div className="space-y-4">
                {Object.entries(tasksByStatus).map(([status, tasks]) => (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-xs text-muted-foreground">{tasks.length}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {tasks.map((task) => (
                        <li key={task.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                          <span className="text-sm">{task.title}</span>
                          <div className="flex items-center gap-2">
                            <PriorityBadge priority={task.priority} />
                            {task.assignee && (
                              <span className="text-xs text-muted-foreground">
                                {task.assignee.name}
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* Artifacts */}
        <TabsContent value="artifacts">
          <SectionCard icon={Paperclip} title="Artifacts">
            {mission.artifacts.length === 0 ? (
              <Empty>No artifacts yet.</Empty>
            ) : (
              <ul className="divide-y">
                {mission.artifacts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="text-sm font-medium">{a.name}</span>
                    <Badge variant="secondary">{a.type}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* Decisions */}
        <TabsContent value="decisions">
          <SectionCard icon={FileText} title="Decision log">
            {mission.decisions.length === 0 ? (
              <Empty>No decisions recorded.</Empty>
            ) : (
              <ul className="space-y-3">
                {mission.decisions.map((d) => (
                  <li key={d.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{d.title}</p>
                      <StatusBadge status={d.status} />
                    </div>
                    {d.outcome && (
                      <p className="mt-1 text-sm text-muted-foreground">{d.outcome}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* Approvals */}
        <TabsContent value="approvals">
          <SectionCard icon={ShieldCheck} title="Approvals">
            <ApprovalsPanel
              approvals={mission.approvals}
              workspaceId={workspaceId}
              missionId={mission.id}
              canApprove={caps.canApprove}
              canContribute={caps.canContribute}
            />
          </SectionCard>
        </TabsContent>

        {/* AI Sessions */}
        <TabsContent value="sessions">
          <SectionCard icon={Bot} title="AI sessions">
            <AiSessionsPanel
              sessions={mission.aiSessions}
              workspaceId={workspaceId}
              missionId={mission.id}
              canContribute={caps.canContribute}
            />
          </SectionCard>
        </TabsContent>

        {/* Metrics */}
        <TabsContent value="metrics">
          <SectionCard icon={BarChart3} title="Metrics">
            {mission.metrics.length === 0 ? (
              <Empty>No metrics recorded.</Empty>
            ) : (
              <ul className="divide-y">
                {mission.metrics.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <span className="text-sm">{m.label}</span>
                    <span className="text-sm font-medium">
                      {m.value}
                      {m.unit}
                      {m.target ? (
                        <span className="text-muted-foreground"> / {m.target}{m.unit}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        {/* Dependencies */}
        <TabsContent value="dependencies">
          <SectionCard icon={Link2} title="Dependencies">
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Depends on
                </p>
                {mission.dependencies.length === 0 ? (
                  <Empty>No upstream dependencies.</Empty>
                ) : (
                  <ul className="space-y-2">
                    {mission.dependencies.map((dep) => (
                      <li key={dep.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm">{dep.dependsOn.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{dep.type}</Badge>
                          <StatusBadge status={dep.dependsOn.status} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {mission.dependents.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Blocks
                  </p>
                  <ul className="space-y-2">
                    {mission.dependents.map((dep) => (
                      <li key={dep.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                        <span className="text-sm">{dep.mission.title}</span>
                        <StatusBadge status={dep.mission.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Notes */}
        <TabsContent value="notes">
          <SectionCard icon={MessageSquare} title="Notes">
            <NotesPanel
              notes={mission.notes}
              workspaceId={workspaceId}
              missionId={mission.id}
              canContribute={caps.canContribute}
            />
          </SectionCard>
        </TabsContent>

        {/* Activity */}
        <TabsContent value="activity">
          <SectionCard icon={ActivityIcon} title="Activity timeline">
            <ActivityFeed items={mission.activities} />
          </SectionCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- Small presentational helpers ------------------------------------------

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Target;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {children}
    </h2>
  );
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: typeof Target;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <FadeIn>
      <Card>
        <CardContent className="space-y-4 p-6">
          <SectionTitle icon={icon}>{title}</SectionTitle>
          {children}
        </CardContent>
      </Card>
    </FadeIn>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">{value || <span className="text-muted-foreground">—</span>}</p>
    </div>
  );
}

function ListField({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <ul className="list-inside list-disc space-y-0.5 text-sm">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function ReferencesField({ items }: { items: { label: string; url: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        References
      </p>
      <ul className="space-y-0.5 text-sm">
        {items.map((ref, i) => (
          <li key={i}>
            <a
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {ref.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function EnvelopeCard({
  icon: Icon,
  label,
  actual,
  estimate,
  unit,
  prefix = false,
}: {
  icon: typeof Clock;
  label: string;
  actual: number | null;
  estimate: number | null;
  unit: string;
  prefix?: boolean;
}) {
  const fmt = (n: number | null) =>
    n === null ? "—" : prefix ? `${unit}${n.toLocaleString()}` : `${n.toLocaleString()}${unit}`;
  const pct =
    actual !== null && estimate && estimate > 0
      ? Math.min(100, Math.round((actual / estimate) * 100))
      : 0;
  return (
    <Card>
      <CardContent className="space-y-3 p-6">
        <SectionTitle icon={Icon}>{label}</SectionTitle>
        <p className="text-2xl font-semibold">{fmt(actual)}</p>
        <p className="text-xs text-muted-foreground">of {fmt(estimate)} planned</p>
        <Progress value={pct} />
      </CardContent>
    </Card>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
