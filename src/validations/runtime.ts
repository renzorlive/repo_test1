import { z } from "zod";

export const runtimeTypeEnum = z.enum([
  "CLAUDE_CODE",
  "CODEX_CLI",
  "GEMINI_CLI",
  "CURSOR_CLI",
  "LOCAL_AGENT",
  "DOCKER",
  "SSH",
]);

export const runtimeCapabilityKindEnum = z.enum([
  "SHELL",
  "FILE_SYSTEM",
  "GIT",
  "CODE_EXECUTION",
  "BROWSER",
  "DOCKER",
  "GPU",
  "NETWORK",
]);

const logStreamEnum = z.enum(["STDOUT", "STDERR", "SYSTEM"]);
const artifactChangeEnum = z.enum(["CREATED", "MODIFIED", "DELETED"]);
const artifactKindEnum = z.enum(["FILE", "TEST_REPORT", "LOG", "DIFF", "OTHER"]);

// ---- User-initiated ---------------------------------------------------------

/** Register a machine. Returns a session token the agent uses to connect. */
export const registerHostSchema = z.object({
  name: z.string().min(2).max(80),
  hostname: z.string().min(1).max(255),
  os: z.string().min(1).max(80),
  arch: z.string().max(40).optional(),
  cpuCores: z.coerce.number().int().min(1).max(1024).default(1),
  cpuModel: z.string().max(120).optional(),
  memoryMb: z.coerce.number().int().min(0).default(0),
  gpu: z.string().max(120).optional(),
  agentVersion: z.string().max(40).optional(),
  runtimeType: runtimeTypeEnum.default("CLAUDE_CODE"),
  capabilities: z
    .array(runtimeCapabilityKindEnum)
    .default(["SHELL", "FILE_SYSTEM", "GIT", "CODE_EXECUTION"]),
});

export const dispatchCommandSchema = z.object({
  hostId: z.string().cuid(),
  name: z.string().min(1).max(120),
  command: z.string().min(1).max(200).default("claude"),
  args: z.array(z.string().max(500)).max(100).default([]),
  cwd: z.string().max(500).optional(),
  env: z.record(z.string(), z.string()).default({}),
  prompt: z.string().max(20000).optional(),
  timeoutMs: z.coerce.number().int().min(1000).max(3_600_000).default(600000),
  aiExecutionId: z.string().cuid().optional(),
});

/** Send an existing AI execution to a host to run on Claude Code. */
export const dispatchAiExecutionSchema = z.object({
  hostId: z.string().cuid(),
});

export type RegisterHostInput = z.infer<typeof registerHostSchema>;
export type DispatchCommandInput = z.infer<typeof dispatchCommandSchema>;
export type DispatchAiExecutionInput = z.infer<typeof dispatchAiExecutionSchema>;

// ---- Agent protocol (token-authenticated) -----------------------------------

export const agentConnectSchema = z.object({
  hostname: z.string().max(255).optional(),
  os: z.string().max(80).optional(),
  arch: z.string().max(40).optional(),
  cpuCores: z.coerce.number().int().min(1).optional(),
  cpuModel: z.string().max(120).optional(),
  memoryMb: z.coerce.number().int().min(0).optional(),
  gpu: z.string().max(120).optional(),
  agentVersion: z.string().max(40).optional(),
});

export const agentHeartbeatSchema = z.object({
  cpuPct: z.coerce.number().min(0).max(100).optional(),
  memMb: z.coerce.number().int().min(0).optional(),
});

export const agentReportSchema = z.object({
  executionId: z.string().cuid(),
  logs: z
    .array(z.object({ stream: logStreamEnum, content: z.string().max(20000) }))
    .max(500)
    .optional(),
  artifacts: z
    .array(
      z.object({
        path: z.string().max(1000),
        change: artifactChangeEnum.default("MODIFIED"),
        kind: artifactKindEnum.default("FILE"),
        sizeBytes: z.coerce.number().int().min(0).optional(),
        url: z.string().url().optional(),
      }),
    )
    .max(500)
    .optional(),
  heartbeat: z
    .object({
      cpuPct: z.coerce.number().min(0).max(100).optional(),
      memMb: z.coerce.number().int().min(0).optional(),
    })
    .optional(),
  complete: z.object({ exitCode: z.coerce.number().int() }).optional(),
});

export type AgentConnectInput = z.infer<typeof agentConnectSchema>;
export type AgentHeartbeatInput = z.infer<typeof agentHeartbeatSchema>;
export type AgentReportInput = z.infer<typeof agentReportSchema>;
