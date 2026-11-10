// app/api/companies/route.ts — GET / POST /api/companies

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { listCompanies, createCompany } from "@/lib/services/companyService";
import { CreateCompanySchema } from "@/lib/models/company";

export async function GET(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const companies = await listCompanies();
    return ok(companies);
  } catch (err) {
    console.error("GET /api/companies failed", err);
    return fail("Internal error", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = CreateCompanySchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((e) => e.message).join("; "));
    }

    const company = await createCompany(parsed.data);
    return ok(company);
  } catch (err) {
    console.error("POST /api/companies failed", err);
    return fail("Internal error", 500);
  }
}