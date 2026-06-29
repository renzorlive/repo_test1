import type { RuntimeType } from "@/types";
import type { RuntimeAdapterContext } from "@/server/runtime/types";

/**
 * Runtime Adapter Interface.
 *
 * The protocol RNZ OS uses to drive a class of remote worker. A runtime is a
 * machine on the other side of the network: an adapter does NOT execute work
 * in-process — it dispatches a job to the remote agent (which claims it via the
 * agent API) and requests cooperative cancellation. Results (logs, artifacts,
 * exit code, heartbeats) flow back through the agent protocol, never through
 * the adapter return value.
 *
 * Claude Code is Runtime #1; Codex/Gemini/Cursor/local/Docker/SSH adapters slot
 * in behind this same interface without touching the engine.
 */
export interface RuntimeAdapter {
  readonly type: RuntimeType;

  /**
   * Make a job available to the remote agent (or push it, depending on the
   * transport). Returns once the job is dispatched — not once it is done.
   */
  dispatch(ctx: RuntimeAdapterContext): Promise<void>;

  /** Request cooperative cancellation; the agent observes it on its next poll. */
  cancel(ctx: Pick<RuntimeAdapterContext, "executionId" | "runtimeType" | "log">): Promise<void>;
}

const adapters = new Map<RuntimeType, RuntimeAdapter>();

export function registerRuntimeAdapter(adapter: RuntimeAdapter): void {
  adapters.set(adapter.type, adapter);
}

export function getRuntimeAdapter(type: RuntimeType): RuntimeAdapter | undefined {
  return adapters.get(type);
}

export function listRuntimeAdapters(): RuntimeType[] {
  return [...adapters.keys()];
}
