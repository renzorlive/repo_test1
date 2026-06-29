import type { RuntimeAdapter } from "@/server/runtime/adapter";
import { registerRuntimeAdapter } from "@/server/runtime/adapter";
import type { RuntimeAdapterContext } from "@/server/runtime/types";

/**
 * Claude Code Runtime Adapter — Runtime #1.
 *
 * Claude Code runs on the user's own machine (laptop, home PC, CI box). RNZ OS
 * never imports a Claude Code SDK and never blocks on it: this adapter only
 * speaks the dispatch/cancel half of the protocol. The remote `rnz-agent`
 * process on the host:
 *   1. polls `/api/runtime/agent/claim` for jobs,
 *   2. starts Claude Code with the job's prompt,
 *   3. streams stdout/stderr to `/api/runtime/agent/report`,
 *   4. posts heartbeats, detected file changes (artifacts) and the exit code.
 *
 * Crucially, this adapter is mission-agnostic — it deals only in generic jobs.
 */
class ClaudeCodeRuntimeAdapter implements RuntimeAdapter {
  readonly type = "CLAUDE_CODE" as const;

  async dispatch(ctx: RuntimeAdapterContext): Promise<void> {
    await ctx.log(
      "SYSTEM",
      "Job dispatched to Claude Code. Awaiting the rnz-agent on the host to claim it and start streaming.",
    );
    if (ctx.spec.prompt) {
      await ctx.log("SYSTEM", `$ claude -p "${truncate(ctx.spec.prompt, 120)}"`);
    } else {
      await ctx.log("SYSTEM", `$ ${ctx.spec.command} ${ctx.spec.args.join(" ")}`);
    }
  }

  async cancel(
    ctx: Pick<RuntimeAdapterContext, "executionId" | "runtimeType" | "log">,
  ): Promise<void> {
    await ctx.log(
      "SYSTEM",
      "Cancellation requested. The agent will stop Claude Code at the next checkpoint.",
    );
  }
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

// Register at import time. `server/runtime/adapters/index.ts` is imported by the
// engine, so the adapter is available wherever the engine runs.
registerRuntimeAdapter(new ClaudeCodeRuntimeAdapter());
