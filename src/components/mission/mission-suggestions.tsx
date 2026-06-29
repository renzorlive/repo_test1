import {
  Sparkles,
  ListTodo,
  Cpu,
  AlertTriangle,
  FileQuestion,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { MissionSuggestions } from "@/server/services";

/**
 * Proactive, AI-shaped suggestions for a mission (heuristic, no model call):
 * next task, next worker, risks, missing context and possible improvements.
 */
export function MissionSuggestionsPanel({
  suggestions,
}: {
  suggestions: MissionSuggestions;
}) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Suggestions
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          <Highlight icon={ListTodo} label="Next task" value={suggestions.nextTask} />
          <Highlight icon={Cpu} label="Next worker" value={suggestions.nextWorker} />
        </div>

        <SuggestionGroup
          icon={AlertTriangle}
          tone="danger"
          title="Potential risks"
          items={suggestions.risks}
        />
        <SuggestionGroup
          icon={FileQuestion}
          tone="warning"
          title="Missing context"
          items={suggestions.missingContext}
        />
        <SuggestionGroup
          icon={TrendingUp}
          tone="muted"
          title="Possible improvements"
          items={suggestions.improvements}
        />
      </CardContent>
    </Card>
  );
}

function Highlight({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function SuggestionGroup({
  icon: Icon,
  tone,
  title,
  items,
}: {
  icon: typeof ListTodo;
  tone: "danger" | "warning" | "muted";
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  const color =
    tone === "danger"
      ? "text-destructive"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";
  return (
    <div className="space-y-1.5">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className={`text-sm ${color}`}>
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
