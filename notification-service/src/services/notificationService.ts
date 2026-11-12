// src/services/notificationService.ts — business logic

import { NotifyInputSchema } from "../models/notification";
import type { Notification } from "../models/notification";
import * as notificationRepo from "../repositories/notificationRepository";

export async function createNotification(
  title: string,
  message: string
): Promise<Notification> {
  // Validate input
  NotifyInputSchema.parse({ title, message });
  return notificationRepo.createNotification(title, message);
}

export async function listNotifications(): Promise<Notification[]> {
  return notificationRepo.findAllNotifications();
}