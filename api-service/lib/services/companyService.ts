// lib/services/companyService.ts — company business logic

import * as repo from "../repositories/companyRepository";
import { sendNotification } from "./notificationClient";
import type { Company } from "../models/company";

export async function listCompanies(): Promise<Company[]> {
  return repo.findAll();
}

export async function createCompany(data: {
  name: string;
  industry?: string;
  phone?: string;
  website?: string;
}): Promise<Company> {
  const company = await repo.create(data);
  // fire-and-forget
  sendNotification("Company Created", `Company "${company.name}" was created.`);
  return company;
}

export async function updateCompany(
  id: string,
  data: {
    name?: string;
    industry?: string;
    phone?: string;
    website?: string;
  }
): Promise<Company> {
  const company = await repo.update(id, data);
  if (!company) throw new Error("Company not found");
  return company;
}

export async function deleteCompany(id: string): Promise<void> {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error("Company not found");
}