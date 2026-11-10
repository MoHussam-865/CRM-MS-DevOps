// lib/models/customer.ts — Zod schema + TS type

import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  company_id: z.string().uuid(),
  company_name: z.string().optional(), // join field from GET /api/customers
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  position: z.string().nullable(),
  status: z.enum(["Lead", "Customer", "Inactive"]),
  created_at: z.string().datetime(),
});

export type Customer = z.infer<typeof CustomerSchema>;

/** Input validation for POST /api/customers */
export const CreateCustomerSchema = z.object({
  company_id: z.string().uuid("company_id must be a valid UUID"),
  name: z.string().min(1, "name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  status: z.enum(["Lead", "Customer", "Inactive"]).optional(),
});