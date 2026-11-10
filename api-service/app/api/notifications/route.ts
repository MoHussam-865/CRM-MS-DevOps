// app/api/notifications/route.ts — GET /api/notifications (proxy to notification service)

import type { NextRequest } from "next/server";
import { fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { getConfig } from "@/lib/config";

export async function GET(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const config = getConfig();
    const url = `${config.NOTIFICATION_SERVICE_URL}/notifications`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.error("Notification service returned", res.status);
      return fail("Notification service error", 502);
    }

    const data = await res.json();
    // Forward the raw response from the notification service verbatim
    return Response.json(data);
  } catch (err) {
    console.error("GET /api/notifications failed", err instanceof Error ? err.message : err);
    return fail("Notification service unavailable", 502);
  }
}