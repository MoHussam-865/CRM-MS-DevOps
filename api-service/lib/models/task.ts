// lib/models/task.ts — Zod schema + TS type

import { z } from "zod";

export const TaskSchema = z.object({
  id: z.string().uuid(),
  customer_id: z.string().uuid(),
  customer_name: z.string().optional(), // join field from GET /api/tasks
  title: z.string(),
  description: z.string().nullable(),
  priority: z.enum(["Low", "Medium", "High"]),
  status: z.enum(["Todo", "In Progress", "Done"]),
  due_date: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

/** Input validation for POST /api/tasks */
export const CreateTaskSchema = z.object({
  customer_id: z.string().uuid("customer_id must be a valid UUID"),
  title: z.string().min(1, "title is required"),
  description: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High"]).optional(),
  status: z.enum(["Todo", "In Progress", "Done"]).optional(),
  due_date: z.string().optional(),
});