// app/api/me/route.ts — GET /api/me

import type { NextRequest } from "next/server";
import { getCurrentUserId } from "@/lib/utils/auth";
import { ok, fail } from "@/lib/utils/response";
import { getMe } from "@/lib/services/authService";

export async function GET(request: NextRequest) {
  const userId = getCurrentUserId(request);
  if (!userId) {
    return fail("Unauthorized", 401);
  }

  try {
    const user = await getMe(userId);
    return ok({ user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return fail(message, 500);
  }
}