import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  steps: string[];
  current: number;
}

/**
 * Horizontal step indicator for the execution wizard. Collapses to a compact
 * "Step N of M" + label on mobile so the full-screen flow stays usable on a
 * phone.
 */
export function WizardStepper({ steps, current }: Props) {
  return (
    <div>
      {/* Mobile: compact */}
      <div className="sm:hidden">
        <p className="text-xs font-medium text-muted-foreground">
          Step {Math.min(current + 1, steps.length)} of {steps.length}
        </p>
        <p className="text-base font-semibold">{steps[current]}</p>
        <div className="mt-2 flex gap-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full",
                i <= current ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {/* Desktop: full stepper */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={step} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                  done && "border-primary bg-primary text-primary-foreground",
                  active && "border-primary text-primary",
                  !done && !active && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step}
              </span>
              {i < steps.length - 1 && (
                <span className="mx-1 h-px w-4 bg-border" />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
