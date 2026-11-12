// src/repositories/notificationRepository.ts — data access layer

import { v4 as uuidv4 } from "uuid";
import { query } from "../db";
import type { Notification } from "../models/notification";

export async function createNotification(
  title: string,
  message: string
): Promise<Notification> {
  const id = uuidv4();
  const result = await query<Notification>(
    `INSERT INTO notifications (id, title, message)
     VALUES ($1, $2, $3)
     RETURNING id, title, message, created_at`,
    [id, title, message]
  );
  return result.rows[0];
}

export async function findAllNotifications(): Promise<Notification[]> {
  const result = await query<Notification>(
    `SELECT id, title, message, created_at
     FROM notifications
     ORDER BY created_at DESC`
  );
  return result.rows;
}