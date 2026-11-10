// lib/models/company.ts — Zod schema + TS type

import { z } from "zod";

export const CompanySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  industry: z.string().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type Company = z.infer<typeof CompanySchema>;

/** Input validation for POST /api/companies */
export const CreateCompanySchema = z.object({
  name: z.string().min(1, "name is required"),
  industry: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});