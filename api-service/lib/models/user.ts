// lib/models/user.ts — zod schemas for user data

import { z } from "zod";

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

/** Shape returned from `GET /api/me` */
export const MeResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: UserSchema,
  }),
});