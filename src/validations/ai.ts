import { z } from "zod";

// ---- Shared enums -----------------------------------------------------------

export const aiProviderTypeEnum = z.enum([
  "OPENAI",
  "ANTHROPIC",
  "GOOGLE",
  "OLLAMA",
  "OPENROUTER",
  "LOCAL",
  "CUSTOM",
]);

export const aiCapabilityKindEnum = z.enum([
  "TEXT_GENERATION",
  "CODE_GENERATION",
  "REASONING",
  "VISION",
  "EMBEDDING",
  "FUNCTION_CALLING",
  "WEB_SEARCH",
  "STRUCTURED_OUTPUT",
  "SUMMARIZATION",
  "CLASSIFICATION",
]);

export const aiWorkerStatusEnum = z.enum([
  "ACTIVE",
  "IDLE",
  "BUSY",
  "DRAINING",
  "DISABLED",
  "ERROR",
]);

export const aiWorkerHealthEnum = z.enum([
  "HEALTHY",
  "DEGRADED",
  "UNHEALTHY",
  "UNKNOWN",
]);

// ---- Providers & models -----------------------------------------------------

export const createProviderSchema = z.object({
  name: z.string().min(2).max(80),
  type: aiProviderTypeEnum,
  baseUrl: z.string().url().optional(),
  enabled: z.boolean().default(true),
  config: z.record(z.string(), z.unknown()).default({}),
});

export const createModelSchema = z.object({
  providerId: z.string().cuid(),
  name: z.string().min(1).max(120),
  label: z.string().min(1).max(120),
  contextWindow: z.coerce.number().int().min(1).default(8192),
  maxOutputTokens: z.coerce.number().int().min(1).default(4096),
  inputCostPer1k: z.coerce.number().min(0).default(0),
  outputCostPer1k: z.coerce.number().min(0).default(0),
});

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type CreateModelInput = z.infer<typeof createModelSchema>;

// ---- Workers (the registry) -------------------------------------------------

export const createWorkerSchema = z.object({
  name: z.string().min(2).max(80),
  role: z.string().min(2).max(60),
  description: z.string().max(1000).optional(),
  providerId: z.string().cuid(),
  modelId: z.string().cuid(),
  capabilities: z.array(aiCapabilityKindEnum).default([]),
  status: aiWorkerStatusEnum.default("IDLE"),
  contextWindow: z.coerce.number().int().min(1).default(8192),
  maxTokens: z.coerce.number().int().min(1).default(4096),
  inputCostPer1k: z.coerce.number().min(0).default(0),
  outputCostPer1k: z.coerce.number().min(0).default(0),
  priority: z.coerce.number().int().min(0).max(100).default(50),
  concurrency: z.coerce.number().int().min(1).max(1000).default(1),
  temperature: z.coerce.number().min(0).max(2).default(0.7),
  timeoutMs: z.coerce.number().int().min(1000).max(600000).default(60000),
  maxRetries: z.coerce.number().int().min(0).max(10).default(2),
  version: z.string().max(40).default("1"),
});

export const updateWorkerSchema = z.object({
  status: aiWorkerStatusEnum.optional(),
  health: aiWorkerHealthEnum.optional(),
  priority: z.coerce.number().int().min(0).max(100).optional(),
  concurrency: z.coerce.number().int().min(1).max(1000).optional(),
  temperature: z.coerce.number().min(0).max(2).optional(),
  version: z.string().max(40).optional(),
  /** Heartbeat: when true, refresh lastSeenAt to now. */
  heartbeat: z.boolean().optional(),
});

export type CreateWorkerInput = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerInput = z.infer<typeof updateWorkerSchema>;

// ---- Queues -----------------------------------------------------------------

export const createQueueSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  priority: z.coerce.number().int().min(0).max(100).default(50),
  concurrency: z.coerce.number().int().min(1).max(1000).default(4),
});

export type CreateQueueInput = z.infer<typeof createQueueSchema>;

// ---- Executions -------------------------------------------------------------

export const submitExecutionSchema = z.object({
  title: z.string().min(2).max(200),
  userRequest: z.string().min(1).max(20000),
  requiredCapability: aiCapabilityKindEnum.default("TEXT_GENERATION"),
  systemInstructions: z.string().max(8000).optional(),
  outputFormat: z.string().max(2000).optional(),
  constraints: z.array(z.string().max(500)).max(50).default([]),
  params: z.record(z.string(), z.unknown()).default({}),
  priority: z.coerce.number().int().min(0).max(100).default(50),
  requiresApproval: z.boolean().default(false),
  // Optional scoping + explicit routing.
  missionId: z.string().cuid().optional(),
  taskId: z.string().cuid().optional(),
  projectId: z.string().cuid().optional(),
  queueId: z.string().cuid().optional(),
  workerId: z.string().cuid().optional(),
});

/** Worker callback when an execution finishes successfully. */
export const completeExecutionSchema = z.object({
  content: z.string().optional(),
  structured: z.record(z.string(), z.unknown()).optional(),
  finishReason: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  confidence: z.coerce.number().min(0).max(1).optional(),
  inputTokens: z.coerce.number().int().min(0).default(0),
  outputTokens: z.coerce.number().int().min(0).default(0),
  latencyMs: z.coerce.number().int().min(0).optional(),
});

export const failExecutionSchema = z.object({
  error: z.string().min(1).max(4000),
  retry: z.boolean().default(true),
});

export const rejectExecutionSchema = z.object({
  reason: z.string().max(2000).optional(),
});

export type SubmitExecutionInput = z.infer<typeof submitExecutionSchema>;
export type CompleteExecutionInput = z.infer<typeof completeExecutionSchema>;
export type FailExecutionInput = z.infer<typeof failExecutionSchema>;
export type RejectExecutionInput = z.infer<typeof rejectExecutionSchema>;

/** Preview the assembled context + prompt for the execution wizard (no writes). */
export const previewExecutionSchema = z.object({
  goal: z.string().min(1, "Describe the goal").max(20000),
  requiredCapability: aiCapabilityKindEnum.default("TEXT_GENERATION"),
  systemInstructions: z.string().max(8000).optional(),
  outputFormat: z.string().max(2000).optional(),
  constraints: z.array(z.string().max(500)).max(50).default([]),
});

export type PreviewExecutionInput = z.infer<typeof previewExecutionSchema>;
