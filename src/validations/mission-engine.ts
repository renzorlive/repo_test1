import { z } from "zod";

// ---- Approvals --------------------------------------------------------------

export const approvalStatusEnum = z.enum([
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
]);

/** Status values a reviewer may transition an approval into (not PENDING). */
export const approvalDecisionEnum = z.enum([
  "APPROVED",
  "REJECTED",
  "CHANGES_REQUESTED",
]);

export const createApprovalSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(4000).optional(),
  reviewerId: z.string().cuid().optional(),
  subjectType: z.string().max(40).optional(),
  subjectId: z.string().cuid().optional(),
});

export const decideApprovalSchema = z.object({
  decision: approvalDecisionEnum,
  comment: z.string().max(4000).optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;
export type DecideApprovalInput = z.infer<typeof decideApprovalSchema>;

// ---- Notes ------------------------------------------------------------------

export const createNoteSchema = z.object({
  body: z.string().min(1, "Note cannot be empty").max(8000),
  pinned: z.boolean().default(false),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// ---- Dependencies -----------------------------------------------------------

export const dependencyTypeEnum = z.enum([
  "BLOCKS",
  "BLOCKED_BY",
  "RELATES_TO",
]);

export const createDependencySchema = z.object({
  dependsOnId: z.string().cuid(),
  type: dependencyTypeEnum.default("BLOCKED_BY"),
  note: z.string().max(500).optional(),
});

export type CreateDependencyInput = z.infer<typeof createDependencySchema>;

// ---- Metrics ----------------------------------------------------------------

export const recordMetricSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers and underscores"),
  label: z.string().min(1).max(80),
  value: z.coerce.number(),
  unit: z.string().max(20).optional(),
  target: z.coerce.number().optional(),
});

export type RecordMetricInput = z.infer<typeof recordMetricSchema>;

// ---- AI Sessions ------------------------------------------------------------

export const aiSessionStatusEnum = z.enum([
  "QUEUED",
  "RUNNING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export const createAiSessionSchema = z.object({
  title: z.string().min(2).max(160),
  agentId: z.string().cuid().optional(),
  model: z.string().max(80).optional(),
  summary: z.string().max(4000).optional(),
});

export const updateAiSessionSchema = z.object({
  status: aiSessionStatusEnum,
  summary: z.string().max(4000).optional(),
  inputTokens: z.coerce.number().int().min(0).optional(),
  outputTokens: z.coerce.number().int().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
});

export type CreateAiSessionInput = z.infer<typeof createAiSessionSchema>;
export type UpdateAiSessionInput = z.infer<typeof updateAiSessionSchema>;

// ---- Context ----------------------------------------------------------------

export const updateContextSchema = z.object({
  background: z.string().max(8000).optional(),
  constraints: z.array(z.string().max(500)).max(50).optional(),
  assumptions: z.array(z.string().max(500)).max(50).optional(),
  references: z
    .array(
      z.object({
        label: z.string().max(160),
        url: z.string().url(),
      }),
    )
    .max(50)
    .optional(),
});

export type UpdateContextInput = z.infer<typeof updateContextSchema>;

// ---- Timeline (milestones) --------------------------------------------------

export const timelineStatusEnum = z.enum([
  "PLANNED",
  "ACTIVE",
  "DONE",
  "SKIPPED",
]);

export const createMilestoneSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(2000).optional(),
  status: timelineStatusEnum.default("PLANNED"),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>;

// ---- Activity query ---------------------------------------------------------

export const activityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  cursor: z.string().cuid().optional(),
});

export type ActivityQuery = z.infer<typeof activityQuerySchema>;
