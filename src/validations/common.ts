import { z } from "zod";

/** Reusable cuid identifier. */
export const idSchema = z.string().cuid();

/** Standard pagination + search query for list endpoints. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
