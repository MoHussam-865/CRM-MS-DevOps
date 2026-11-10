// lib/services/notificationClient.ts — fire-and-forget HTTP calls to notification-service

import { getConfig } from "../config";

export async function sendNotification(title: string, message: string): Promise<void> {
  try {
    const config = getConfig();
    const url = `${config.NOTIFICATION_SERVICE_URL}/notify`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message }),
    });
  } catch (err) {
    // fire-and-forget: log but never fail the main request
    console.error("Notification failed:", err instanceof Error ? err.message : err);
  }
}