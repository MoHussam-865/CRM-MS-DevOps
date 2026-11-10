// app/api/customers/route.ts — GET / POST /api/customers

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/utils/response";
import { getCurrentUserId } from "@/lib/utils/auth";
import { listCustomers, createCustomer } from "@/lib/services/customerService";
import { CreateCustomerSchema } from "@/lib/models/customer";

export async function GET(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const customers = await listCustomers();
    return ok(customers);
  } catch (err) {
    console.error("GET /api/customers failed", err);
    return fail("Internal error", 500);
  }
}

export async function POST(request: NextRequest) {
  if (!getCurrentUserId(request)) return fail("Unauthorized", 401);

  try {
    const body = await request.json();
    const parsed = CreateCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return fail(parsed.error.issues.map((e) => e.message).join("; "));
    }

    const customer = await createCustomer(parsed.data);
    return ok(customer);
  } catch (err) {
    console.error("POST /api/customers failed", err);
    return fail("Internal error", 500);
  }
}