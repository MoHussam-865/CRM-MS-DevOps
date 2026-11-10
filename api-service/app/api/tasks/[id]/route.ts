// app/api/tasks/[id]/route.ts — PUT / DELETE /api/tasks/:id

import type { NextRequest } from "next/server";
import { ok, okMessage, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { updateTask, deleteTask } from "@/lib/services/taskService";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const task = await updateTask(id, body);
    return ok(task);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Task not found" ? 404 : 500;
    return fail(message, status);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/tasks/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    await deleteTask(id);
    return okMessage("Deleted");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Task not found" ? 404 : 500;
    return fail(message, status);
  }
}