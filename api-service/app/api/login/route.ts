// app/api/login/route.ts — POST /api/login

import type { NextRequest } from "next/server";
import { login } from "@/lib/services/authService";
import { ok, fail } from "@/lib/utils/response";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return fail("email and password are required");
    }

    const result = await login(email, password);
    return ok({ token: result.token, user: result.user });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed";
    return fail(message, 401);
  }
}