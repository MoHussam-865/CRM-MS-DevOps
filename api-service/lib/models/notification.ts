// lib/models/notification.ts — Notification type (mirrors notification-service shape)

import { z } from "zod";

export const NotificationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  message: z.string(),
  created_at: z.string().datetime(),
});

export type Notification = z.infer<typeof NotificationSchema>;