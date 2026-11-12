// src/models/notification.ts — Notification types & validation

import { z } from "zod";

export const NotifyInputSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  message: z.string().min(1, "Message is required").max(5000),
});

export type NotifyInput = z.infer<typeof NotifyInputSchema>;

export interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  created_at: z.string().datetime(),
});