"use client";

import * as React from "react";
import Link from "next/link";
import {
  X,
  ArrowRight,
  ArrowLeft,
  Play,
  Check,
  Loader2,
  AlertTriangle,
  Cpu,
  Layers,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { WizardStepper } from "./wizard-stepper";
import { ExecutionLiveView } from "./execution-live-view";
import { WorkerHealthDot } from "@/components/ai/execution-state-badge";
import { useExecution } from "@/hooks/use-execution";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AiCapabilityKind } from "@/types";
import type { AiExecutionAggregate } from "@/server/repositories";
import type { MissionSuggestions } from "@/server/services";
import type { ContextPackage, PromptPackage } from "@/server/ai/types";

export interface WizardMission {
  id: string;
  title: string;
  summary: string | null;
  objective: string | null;
  background: string | null;
  openTasks: number;
  projectKey: string;
}

export interface WizardWorker {
  id: string;
  name: string;
  role: string;
  status: string;
  health: string;
  provider: { name: string };
  model: { label: string };
  inputCostPer1k: number;
  outputCostPer1k: number;
  capabilities: { kind: string }[];
}

interface Props {
  mission: WizardMission;
  workers: WizardWorker[];
  suggestions: MissionSuggestions;
  workspaceId: string;
  caps: { canApprove: boolean; canRun: boolean };
}

const STEPS = [
  "Review Mission",
  "Choose Goal",
  "Select Workers",
  "Review Context",
  "Review Prompt",
  "Launch",
  "Live Progress",
  "Approve / Continue",
];

const GOAL_PRESETS: {
  label: string;
  capability: AiCapabilityKind;
  template: string;
}[] = [
  { label: "Plan & break down", capability: "REASONING", template: "Break this mission into epics and tasks with clear acceptance criteria." },
  { label: "Write code", capability: "CODE_GENERATION", template: "Implement the next task with production-ready code and tests." },
  { label: "Research", capability: "WEB_SEARCH", template: "Research the best approach and summarize the options with trade-offs." },
  { label: "Write docs", capability: "TEXT_GENERATION", template: "Draft clear documentation for the mission's current state." },
  { label: "Review & QA", capability: "REASONING", template: "Review recent work for correctness, risks and improvements." },
  { label: "Summarize", capability: "SUMMARIZATION", template: "Summarize the mission progress and decisions to date." },
];

export function ExecutionWizard({
  mission,
  workers,
  suggestions,
  workspaceId,
  caps,
}: Props) {
  const [step, setStep] = React.useState(0);
  const [presetLabel, setPresetLabel] = React.useState<string | null>(null);
  const [goal, setGoal] = React.useState("");
  const [capability, setCapability] =
    React.useState<AiCapabilityKind>("TEXT_GENERATION");
  const [workerId, setWorkerId] = React.useState<string | null>(null);
  const [requiresApproval, setRequiresApproval] = React.useState(false);

  const [preview, setPreview] = React.useState<{
    context: ContextPackage;
    prompt: PromptPackage;
  } | null>(null);
  const [previewLoading, setPreviewLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [executionId, setExecutionId] = React.useState<string | null>(null);
  const [launching, setLaunching] = React.useState(false);
  const execution = useExecution(workspaceId, executionId);

  const base = `/api/workspaces/${workspaceId}/missions/${mission.id}`;

  async function loadPreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const data = await apiClient<{ context: ContextPackage; prompt: PromptPackage }>(
        `${base}/execution-preview`,
        { method: "POST", body: JSON.stringify({ goal, requiredCapability: capability }) },
      );
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not build preview");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function launch() {
    setLaunching(true);
    setError(null);
    try {
      const result = await apiClient<AiExecutionAggregate>(
        `/api/workspaces/${workspaceId}/ai/executions`,
        {
          method: "POST",
          body: JSON.stringify({
            title: presetLabel ? `${presetLabel}: ${mission.title}` : mission.title,
            userRequest: goal,
            requiredCapability: capability,
            missionId: mission.id,
            workerId,
            requiresApproval,
          }),
        },
      );
      setExecutionId(result.id);
      setStep(6);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Launch failed");
    } finally {
      setLaunching(false);
    }
  }

  // Once launched, the stepper reflects the live execution state.
  const liveAttention =
    execution.data &&
    ["WAITING_APPROVAL", "COMPLETED", "FAILED", "CANCELLED"].includes(
      execution.data.state,
    );
  const currentStep = executionId ? (liveAttention ? 7 : 6) : step;

  async function next() {
    setError(null);
    if (step === 2) {
      await loadPreview();
    }
    setStep((s) => Math.min(s + 1, 5));
  }
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canNext =
    (step === 0) ||
    (step === 1 && goal.trim().length > 1) ||
    (step === 2 && Boolean(workerId)) ||
    (step === 3 && Boolean(preview)) ||
    (step === 4 && Boolean(preview));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Execute Mission</p>
            <p className="truncate text-sm font-semibold">{mission.title}</p>
          </div>
          <Button asChild variant="ghost" size="icon" aria-label="Close">
            <Link href={`/missions/${mission.id}`}>
              <X className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="mx-auto w-full max-w-5xl px-4 pb-4">
          <WizardStepper steps={STEPS} current={currentStep} />
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Live mode */}
        {executionId ? (
          execution.data ? (
            <ExecutionLiveView
              execution={execution.data}
              workspaceId={workspaceId}
              caps={caps}
              missionId={mission.id}
              remainingTasks={mission.openTasks}
              refetch={execution.refetch}
              onRunAnother={() => {
                setExecutionId(null);
                setPreview(null);
                setStep(1);
              }}
            />
          ) : (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading execution…
            </div>
          )
        ) : (
          <>
            {step === 0 && <ReviewMission mission={mission} suggestions={suggestions} />}
            {step === 1 && (
              <ChooseGoal
                goal={goal}
                setGoal={setGoal}
                presetLabel={presetLabel}
                onPreset={(p) => {
                  setPresetLabel(p.label);
                  setGoal(p.template);
                  setCapability(p.capability);
                }}
              />
            )}
            {step === 2 && (
              <SelectWorkers
                workers={workers}
                capability={capability}
                selected={workerId}
                onSelect={setWorkerId}
              />
            )}
            {step === 3 && <ReviewContext preview={preview} loading={previewLoading} />}
            {step === 4 && <ReviewPrompt preview={preview} />}
            {step === 5 && (
              <LaunchStep
                goal={goal}
                capability={capability}
                worker={workers.find((w) => w.id === workerId) ?? null}
                requiresApproval={requiresApproval}
                setRequiresApproval={setRequiresApproval}
              />
            )}
          </>
        )}
      </main>

      {/* Footer nav (hidden in live mode) */}
      {!executionId && (
        <footer className="fixed inset-x-0 bottom-0 border-t bg-background/95 backdrop-blur-md">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {step < 5 ? (
              <Button onClick={next} disabled={!canNext || previewLoading}>
                {previewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={launch} disabled={launching || !caps.canRun}>
                {launching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
                Launch Execution
              </Button>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}

// ---- Step content ----------------------------------------------------------

function StepTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-1 text-2xl font-semibold tracking-tight">{children}</h1>;
}

function ReviewMission({
  mission,
  suggestions,
}: {
  mission: WizardMission;
  suggestions: MissionSuggestions;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Review the mission</StepTitle>
        <p className="text-muted-foreground">
          Confirm what this execution is grounded in before you launch.
        </p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          <Field label="Objective" value={mission.objective} />
          <Field label="Summary" value={mission.summary} />
          <Field label="Background" value={mission.background} />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <SuggestionList title="Risks" tone="danger" items={suggestions.risks} />
        <SuggestionList
          title="Missing context"
          tone="warning"
          items={suggestions.missingContext}
        />
      </div>
    </div>
  );
}

function ChooseGoal({
  goal,
  setGoal,
  presetLabel,
  onPreset,
}: {
  goal: string;
  setGoal: (v: string) => void;
  presetLabel: string | null;
  onPreset: (p: (typeof GOAL_PRESETS)[number]) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Choose a goal</StepTitle>
        <p className="text-muted-foreground">
          Pick a starting point, then refine the instruction.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {GOAL_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => onPreset(preset)}
            className={cn(
              "rounded-lg border p-4 text-left text-sm transition-colors hover:border-primary/50",
              presetLabel === preset.label && "border-primary bg-primary/5 ring-1 ring-primary",
            )}
          >
            <span className="font-medium">{preset.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {preset.capability.replace(/_/g, " ").toLowerCase()}
            </span>
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Instruction</label>
        <Textarea
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe exactly what the AI worker should do…"
          className="min-h-32"
        />
      </div>
    </div>
  );
}

function SelectWorkers({
  workers,
  capability,
  selected,
  onSelect,
}: {
  workers: WizardWorker[];
  capability: AiCapabilityKind;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (workers.length === 0) {
    return (
      <div className="space-y-2">
        <StepTitle>Select AI workers</StepTitle>
        <p className="text-muted-foreground">
          No workers registered. Add one in the AI Orchestrator first.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Select AI workers</StepTitle>
        <p className="text-muted-foreground">
          Workers that advertise{" "}
          <span className="font-medium">
            {capability.replace(/_/g, " ").toLowerCase()}
          </span>{" "}
          are recommended.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {workers.map((worker) => {
          const matches = worker.capabilities.some((c) => c.kind === capability);
          const active = selected === worker.id;
          return (
            <button
              key={worker.id}
              onClick={() => onSelect(worker.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:border-primary/50",
                active && "border-primary bg-primary/5 ring-1 ring-primary",
              )}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Cpu className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{worker.name}</span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  {worker.role} · {worker.provider.name} · {worker.model.label}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <WorkerHealthDot health={worker.health} />
                  {matches && (
                    <Badge variant="success" className="text-[10px]">
                      recommended
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ReviewContext({
  preview,
  loading,
}: {
  preview: { context: ContextPackage } | null;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Review generated context</StepTitle>
        <p className="text-muted-foreground">
          The Context Builder assembled this from your mission — no AI calls.
        </p>
      </div>
      {loading || !preview ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Assembling context…
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {preview.context.sections.length} sections ·{" "}
            {preview.context.totalTokensEstimated.toLocaleString()} est. tokens
          </p>
          <div className="space-y-3">
            {preview.context.sections.map((s) => (
              <Card key={s.key}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{s.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      ~{s.tokensEstimated} tok
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                    {s.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewPrompt({ preview }: { preview: { prompt: PromptPackage } | null }) {
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Review generated prompt</StepTitle>
        <p className="text-muted-foreground">
          Versioned and hashed for reproducibility.
        </p>
      </div>
      {!preview ? (
        <p className="text-muted-foreground">No prompt available.</p>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />v{preview.prompt.version} · ~
            {preview.prompt.tokensEstimated.toLocaleString()} tokens · hash{" "}
            {preview.prompt.hash.slice(0, 12)}
          </p>
          {preview.prompt.messages.map((m, i) => (
            <Card key={i}>
              <CardContent className="space-y-1 p-4">
                <Badge variant="secondary">{m.role}</Badge>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs scrollbar-thin">
                  {m.content}
                </pre>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

function LaunchStep({
  goal,
  capability,
  worker,
  requiresApproval,
  setRequiresApproval,
}: {
  goal: string;
  capability: AiCapabilityKind;
  worker: WizardWorker | null;
  requiresApproval: boolean;
  setRequiresApproval: (v: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <StepTitle>Launch execution</StepTitle>
        <p className="text-muted-foreground">Confirm and run.</p>
      </div>
      <Card>
        <CardContent className="space-y-3 p-5">
          <Field label="Goal" value={goal} />
          <Field
            label="Capability"
            value={capability.replace(/_/g, " ").toLowerCase()}
          />
          <Field
            label="Worker"
            value={worker ? `${worker.name} · ${worker.model.label}` : "—"}
          />
        </CardContent>
      </Card>
      <label className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Require approval before completing</p>
          <p className="text-xs text-muted-foreground">
            Pause at a human gate before the result is accepted.
          </p>
        </div>
        <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
      </label>
    </div>
  );
}

// ---- Small helpers ---------------------------------------------------------

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm">
        {value || <span className="text-muted-foreground">—</span>}
      </p>
    </div>
  );
}

function SuggestionList({
  title,
  tone,
  items,
}: {
  title: string;
  tone: "danger" | "warning";
  items: string[];
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm font-medium">{title}</p>
        {items.length === 0 ? (
          <p className="text-xs text-muted-foreground">None detected.</p>
        ) : (
          <ul className="space-y-1">
            {items.map((item, i) => (
              <li
                key={i}
                className={cn(
                  "flex items-start gap-1.5 text-xs",
                  tone === "danger" ? "text-destructive" : "text-amber-600 dark:text-amber-400",
                )}
              >
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
