// lib/services/customerService.ts — customer business logic

import * as repo from "../repositories/customerRepository";
import { sendNotification } from "./notificationClient";
import type { Customer } from "../models/customer";

export async function listCustomers(): Promise<Customer[]> {
  return repo.findAll();
}

export async function createCustomer(data: {
  company_id: string;
  name: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: string;
}): Promise<Customer> {
  const customer = await repo.create(data);
  // fire-and-forget
  sendNotification("Customer Created", `Customer "${customer.name}" was created.`);
  return customer;
}

export async function updateCustomer(
  id: string,
  data: {
    company_id?: string;
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
    status?: string;
  }
): Promise<Customer> {
  const customer = await repo.update(id, data);
  if (!customer) throw new Error("Customer not found");
  return customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const deleted = await repo.remove(id);
  if (!deleted) throw new Error("Customer not found");
}