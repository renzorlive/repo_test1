import { Check, AlertTriangle, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ConfidenceResult } from "@/lib/confidence";

function tone(score: number, threshold: number) {
  if (score >= threshold) return { ring: "text-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (score >= threshold - 20) return { ring: "text-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { ring: "text-red-500", text: "text-red-600 dark:text-red-400" };
}

/**
 * The brain's self-assessment — how much it knows before acting. The signals
 * make the score explainable; the missing list is what it would ask for.
 */
export function ConfidencePanel({ result }: { result: ConfidenceResult }) {
  const t = tone(result.score, result.threshold);
  const circumference = 2 * Math.PI * 26;
  const dash = (result.score / 100) * circumference;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <BrainCircuit className="h-4 w-4 text-primary" />
          Confidence
        </h3>

        <div className="flex items-center gap-4">
          {/* Score ring */}
          <div className="relative h-16 w-16 shrink-0">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6" className="stroke-muted" />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                className={cn("stroke-current", t.ring)}
              />
            </svg>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-sm font-semibold",
                t.text,
              )}
            >
              {result.score}%
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className={cn("text-sm font-medium", t.text)}>
              {result.canAutoExecute
                ? "Confident enough to execute"
                : `Below ${result.threshold}% — will ask before executing`}
            </p>
            <p className="text-xs text-muted-foreground">
              The brain only runs autonomously when it knows enough.
            </p>
          </div>
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {result.signals.map((s) => (
            <li
              key={s.label}
              className={cn(
                "flex items-center gap-1.5 text-xs",
                s.present ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.present ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              )}
              {s.label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
