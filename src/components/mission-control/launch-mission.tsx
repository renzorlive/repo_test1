"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";

const EXAMPLES = [
  "Launch GOCO Marketplace",
  "Build the new homepage for GOCO",
  "Ship a TikTok content engine",
];

/**
 * The single thing a founder does: state an outcome. The Mission Brain handles
 * planning, workers, runtimes, prompts and execution — autonomously.
 */
export function LaunchMission({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const [objective, setObjective] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function launch(value: string) {
    if (value.trim().length < 4) return;
    setPending(true);
    setError(null);
    try {
      const mission = await apiClient<{ id: string }>(
        `/api/workspaces/${workspaceId}/missions/launch`,
        { method: "POST", body: JSON.stringify({ objective: value }) },
      );
      router.push(`/missions/${mission.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not launch the mission");
      setPending(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-semibold leading-tight">Launch a mission</h2>
            <p className="text-xs text-muted-foreground">
              Describe the outcome. The Mission Brain does the rest.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void launch(objective);
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="What do you want to build?"
            className="h-11 flex-1 text-base"
            disabled={pending}
          />
          <Button type="submit" size="lg" disabled={pending || objective.trim().length < 4}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Launch
          </Button>
        </form>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={pending}
              onClick={() => {
                setObjective(ex);
                void launch(ex);
              }}
              className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {ex}
            </button>
          ))}
        </div>

        <div className="border-t pt-3">
          <Link
            href="/continue"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <RotateCcw className="h-4 w-4" />
            …or continue an existing project — “Continue GOCO”
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
