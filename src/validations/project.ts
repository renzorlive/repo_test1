import { z } from "zod";

export const projectStatusEnum = z.enum([
  "PLANNING",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);

export const createProjectSchema = z.object({
  name: z.string().min(2, "Name is too short").max(120),
  key: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/, "Use 2-8 uppercase letters or numbers"),
  description: z.string().max(2000).optional(),
  status: projectStatusEnum.default("PLANNING"),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, "Use a hex color")
    .optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
