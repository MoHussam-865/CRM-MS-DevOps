// app/api/customers/[id]/route.ts — PUT / DELETE /api/customers/:id

import type { NextRequest } from "next/server";
import { ok, okMessage, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { updateCustomer, deleteCustomer } from "@/lib/services/customerService";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const customer = await updateCustomer(id, body);
    return ok(customer);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Customer not found" ? 404 : 500;
    return fail(message, status);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/customers/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    await deleteCustomer(id);
    return okMessage("Deleted");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Customer not found" ? 404 : 500;
    return fail(message, status);
  }
}