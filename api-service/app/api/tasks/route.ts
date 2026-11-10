// app/api/tasks/route.ts — GET / POST /api/tasks

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { listTasks, createTask } from "@/lib/services/taskService";
import { CreateTaskSchema } from "@/lib/models/task";

export async function GET(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const tasks = await listTasks();
    return ok(tasks);
  } catch (err) {
    console.error("GET /api/tasks failed", err);
    return fail("Internal error", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((e) => e.message).join("; "));
    }

    const task = await createTask(parsed.data);
    return ok(task);
  } catch (err) {
    console.error("POST /api/tasks failed", err);
    return fail("Internal error", 500);
  }
}