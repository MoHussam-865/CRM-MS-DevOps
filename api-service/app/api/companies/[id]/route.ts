// app/api/companies/[id]/route.ts — PUT / DELETE /api/companies/:id

import type { NextRequest } from "next/server";
import { ok, okMessage, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { updateCompany, deleteCompany } from "@/lib/services/companyService";

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/companies/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const company = await updateCompany(id, body);
    return ok(company);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    const status = message === "Company not found" ? 404 : 500;
    return fail(message, status);
  }
}

export async function DELETE(request: NextRequest, ctx: RouteContext<"/api/companies/[id]">) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const { id } = await ctx.params;
    await deleteCompany(id);
    return okMessage("Deleted");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Delete failed";
    const status = message === "Company not found" ? 404 : 500;
    return fail(message, status);
  }
}