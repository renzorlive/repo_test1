import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  slug: z
    .string()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes")
    .optional(),
  imageUrl: z.string().url().optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
