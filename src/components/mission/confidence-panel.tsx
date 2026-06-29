import { Check, AlertTriangle, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConfidenceDimension, ConfidenceResult } from "@/lib/confidence";

function tone(score: number, threshold: number) {
  if (score >= threshold)
    return { ring: "text-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= threshold - 20)
    return { ring: "text-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { ring: "text-red-500", text: "text-red-600 dark:text-red-400" };
}

/**
 * Confidence v2 — four dimensions, not one number. The brain can be sure it can
 * *plan* but sure it *cannot deploy* without credentials, and this panel shows
 * exactly that: a ring per dimension, with the signals that explain each score.
 */
export function ConfidencePanel({ result }: { result: ConfidenceResult }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Confidence
          </h3>
          <span className="text-xs text-muted-foreground">
            {result.overall}% overall
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {result.dimensions.map((d) => (
            <DimensionCard key={d.key} dimension={d} />
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {result.canAutoExecute
            ? "Confident enough to execute autonomously."
            : "Below the execution bar — the brain will ask before running."}
        </p>
      </CardContent>
    </Card>
  );
}

function DimensionCard({ dimension }: { dimension: ConfidenceDimension }) {
  const t = tone(dimension.score, dimension.threshold);
  const circumference = 2 * Math.PI * 18;
  const dash = (dimension.score / 100) * circumference;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0">
          <svg className="h-12 w-12 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="18" fill="none" strokeWidth="5" className="stroke-muted" />
            <circle
              cx="24"
              cy="24"
              r="18"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              className={cn("stroke-current", t.ring)}
            />
          </svg>
          <span
            className={cn(
              "absolute inset-0 flex items-center justify-center text-[11px] font-semibold",
              t.text,
            )}
          >
            {dimension.score}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{dimension.label}</p>
          <p className={cn("text-xs", dimension.ok ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
            {dimension.ok ? "Ready" : `Needs ≥ ${dimension.threshold}%`}
          </p>
        </div>
      </div>

      <ul className="mt-2 space-y-1">
        {dimension.signals.map((s) => (
          <li
            key={s.label}
            className={cn(
              "flex items-center gap-1.5 text-[11px]",
              s.present ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {s.present ? (
              <Check className="h-3 w-3 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-500" />
            )}
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
