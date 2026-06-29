import type { RuntimeLogStream, RuntimeType } from "@/types";

/**
 * Generic, mission-agnostic job types for the Runtime Layer.
 *
 * A runtime only ever sees these shapes. Nothing here references missions,
 * AI executions or any RNZ OS domain concept — a runtime runs jobs and streams
 * back logs, artifacts, heartbeats and an exit code.
 */

/** What to run. The unit a runtime understands. */
export interface RuntimeJobSpec {
  command: string;
  args: string[];
  cwd?: string | null;
  env: Record<string, string>;
  /** For AI runtimes (e.g. Claude Code), the prompt to execute. */
  prompt?: string | null;
  timeoutMs: number;
}

/** The job handed to a remote agent when it claims work. */
export interface ClaimedJob {
  executionId: string;
  attempt: number;
  spec: RuntimeJobSpec;
}

/** A streamed log line reported by the agent. */
export interface RuntimeLogChunk {
  stream: RuntimeLogStream;
  content: string;
}

/** A detected file/output reported by the agent. */
export interface RuntimeArtifactRecord {
  path: string;
  change: "CREATED" | "MODIFIED" | "DELETED";
  kind: "FILE" | "TEST_REPORT" | "LOG" | "DIFF" | "OTHER";
  sizeBytes?: number;
  url?: string;
}

/** The runtime adapter's view of an execution it is dispatching/cancelling. */
export interface RuntimeAdapterContext {
  executionId: string;
  runtimeType: RuntimeType;
  spec: RuntimeJobSpec;
  /** Append a line to the execution's terminal (provided by the engine). */
  log: (stream: RuntimeLogStream, content: string) => Promise<void>;
}
