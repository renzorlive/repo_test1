import { z } from "zod";

export const missionStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "BLOCKED",
  "COMPLETED",
  "CANCELLED",
]);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const createMissionSchema = z.object({
  projectId: z.string().cuid(),
  title: z.string().min(2, "Title is too short").max(160),
  summary: z.string().max(2000).optional(),
  status: missionStatusEnum.default("DRAFT"),
  priority: priorityEnum.default("MEDIUM"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  dueDate: z.coerce.date().optional(),
});

export const updateMissionSchema = createMissionSchema
  .omit({ projectId: true })
  .partial();

export type CreateMissionInput = z.infer<typeof createMissionSchema>;
export type UpdateMissionInput = z.infer<typeof updateMissionSchema>;
