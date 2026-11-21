import { z } from "zod";
import { roles } from "./permissions";

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  role: z.enum(roles),
});
export type User = z.infer<typeof userSchema>;

const postStatusSchema = z.enum(["draft", "published"]);

export const postSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  body: z.string(),
  status: postStatusSchema,
  updatedAt: z.iso.datetime(),
});
export type Post = z.infer<typeof postSchema>;

export const postStatusUpdateSchema = z.object({
  status: postStatusSchema,
});

export const loginRequestSchema = z.object({
  role: z.enum(roles),
});

export const loginResponseSchema = z.object({
  accessToken: z.string(),
  user: userSchema,
});
