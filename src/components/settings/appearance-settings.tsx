"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const options = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="grid max-w-md grid-cols-3 gap-3">
      {options.map((option) => {
        const Icon = option.icon;
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-all",
              active
                ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary"
                : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
