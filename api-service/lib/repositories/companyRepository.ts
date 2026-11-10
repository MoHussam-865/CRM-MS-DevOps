// lib/repositories/companyRepository.ts — company DB queries

import { query } from "../db";
import type { Company } from "../models/company";

const COLS = `id, name, industry, phone, website, created_at::text AS created_at`;

export async function findAll(): Promise<Company[]> {
  const { rows } = await query<Company>(
    `SELECT ${COLS} FROM companies ORDER BY created_at DESC`
  );
  return rows;
}

export async function findById(id: string): Promise<Company | null> {
  const { rows } = await query<Company>(
    `SELECT ${COLS} FROM companies WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  name: string;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
}): Promise<Company> {
  const { rows } = await query<Company>(
    `INSERT INTO companies (name, industry, phone, website)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLS}`,
    [data.name, data.industry ?? null, data.phone ?? null, data.website ?? null]
  );
  return rows[0];
}

export async function update(
  id: string,
  data: {
    name?: string;
    industry?: string | null;
    phone?: string | null;
    website?: string | null;
  }
): Promise<Company | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (data.name !== undefined) { sets.push(`name = $${idx++}`); vals.push(data.name); }
  if (data.industry !== undefined) { sets.push(`industry = $${idx++}`); vals.push(data.industry ?? null); }
  if (data.phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(data.phone ?? null); }
  if (data.website !== undefined) { sets.push(`website = $${idx++}`); vals.push(data.website ?? null); }

  if (sets.length === 0) {
    return findById(id);
  }

  vals.push(id);
  const { rows } = await query<Company>(
    `UPDATE companies SET ${sets.join(", ")} WHERE id = $${idx} RETURNING ${COLS}`,
    vals
  );
  return rows[0] ?? null;
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM companies WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}