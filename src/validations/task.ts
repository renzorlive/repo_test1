import { z } from "zod";
import { priorityEnum } from "@/validations/mission";

export const taskStatusEnum = z.enum([
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "BLOCKED",
  "DONE",
]);

export const createTaskSchema = z.object({
  projectId: z.string().cuid(),
  epicId: z.string().cuid().optional(),
  title: z.string().min(2, "Title is too short").max(200),
  description: z.string().max(4000).optional(),
  status: taskStatusEnum.default("TODO"),
  priority: priorityEnum.default("MEDIUM"),
  assigneeId: z.string().cuid().optional(),
  agentId: z.string().cuid().optional(),
});

export const updateTaskSchema = createTaskSchema
  .omit({ projectId: true })
  .partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
