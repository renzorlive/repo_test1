import { z } from "zod";

export const agentTypeEnum = z.enum([
  "ORCHESTRATOR",
  "RESEARCHER",
  "ENGINEER",
  "WRITER",
  "ANALYST",
  "REVIEWER",
  "CUSTOM",
]);

export const agentStatusEnum = z.enum([
  "IDLE",
  "RUNNING",
  "PAUSED",
  "ERROR",
  "DISABLED",
]);

export const createAgentSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  description: z.string().max(1000).optional(),
  type: agentTypeEnum.default("CUSTOM"),
  status: agentStatusEnum.default("IDLE"),
  instructions: z.string().max(8000).optional(),
  config: z.record(z.string(), z.unknown()).default({}),
  avatarUrl: z.string().url().optional(),
});

export const updateAgentSchema = createAgentSchema.partial();

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
