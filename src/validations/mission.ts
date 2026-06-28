import { z } from "zod";

export const missionStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);

export const missionHealthEnum = z.enum([
  "ON_TRACK",
  "AT_RISK",
  "OFF_TRACK",
  "BLOCKED",
  "UNKNOWN",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

/**
 * Full create payload for a mission. `projectId` anchors the mission; the
 * service derives `workspaceId` from the project so the client never sends it.
 */
export const createMissionSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2, "Title is too short").max(160),
  summary: z.string().max(2000).optional(),
  objective: z.string().max(2000).optional(),
  outcome: z.string().max(2000).optional(),
  status: missionStatusEnum.default("DRAFT"),
  health: missionHealthEnum.default("UNKNOWN"),
  priority: priorityEnum.default("MEDIUM"),
  ownerId: z.string().cuid().optional(),
  dueDate: z.coerce.date().optional(),
  estimatedHours: z.coerce.number().min(0).max(100000).optional(),
  estimatedCost: z.coerce.number().min(0).optional(),
});

/**
 * Partial update. Progress and the actuals are mutable here, but the service
 * also recomputes progress from task rollups, so manual values are advisory.
 */
export const updateMissionSchema = createMissionSchema
  .omit({ projectId: true })
  .extend({
    progress: z.coerce.number().int().min(0).max(100).optional(),
    actualHours: z.coerce.number().min(0).max(100000).optional(),
    actualCost: z.coerce.number().min(0).optional(),
  })
  .partial();

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>;
