import { z } from "zod";

export const createPostSchema = z.object({
  body: z.string().min(1).max(4000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
