// lib/repositories/customerRepository.ts — customer DB queries

import { query } from "../db";
import type { Customer } from "../models/customer";

const COLS = `c.id, c.company_id, c.name, c.email, c.phone, c.position, c.status, c.created_at::text AS created_at`;
const JOIN_COLS = `${COLS}, co.name AS company_name`;

export async function findAll(): Promise<Customer[]> {
  const { rows } = await query<Customer>(
    `SELECT ${JOIN_COLS}
     FROM customers c
     LEFT JOIN companies co ON co.id = c.company_id
     ORDER BY c.created_at DESC`
  );
  return rows;
}

export async function findById(id: string): Promise<Customer | null> {
  const { rows } = await query<Customer>(
    `SELECT ${JOIN_COLS}
     FROM customers c
     LEFT JOIN companies co ON co.id = c.company_id
     WHERE c.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  status?: string | null;
}): Promise<Customer> {
  const { rows } = await query<Customer>(
    `INSERT INTO customers (company_id, name, email, phone, position, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLS}`,
    [
      data.company_id,
      data.name,
      data.email ?? null,
      data.phone ?? null,
      data.position ?? null,
      data.status ?? "Lead",
    ]
  );
  // Return with company_name for consistency
  return findById(rows[0].id) as Promise<Customer>;
}

export async function update(
  id: string,
  data: {
    company_id?: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    position?: string | null;
    status?: string | null;
  }
): Promise<Customer | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (data.company_id !== undefined) { sets.push(`company_id = $${idx++}`); vals.push(data.company_id); }
  if (data.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(data.name); }
  if (data.email !== undefined) { sets.push(`email = $${idx++}`); vals.push(data.email ?? null); }
  if (data.phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(data.phone ?? null); }
  if (data.position !== undefined) { sets.push(`position = $${idx++}`); vals.push(data.position ?? null); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(data.status); }

  if (sets.length === 0) {
    return findById(id);
  }

  vals.push(id);
  const { rows } = await query<Customer>(
    `UPDATE customers SET ${sets.join(", ")} WHERE id = $${idx}`,
    vals
  );
  if (rows.length === 0) return null;
  // Re-fetch to include join fields
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM customers WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}