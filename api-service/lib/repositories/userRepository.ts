// lib/repositories/userRepository.ts — user DB queries

import { query } from "../db";
import type { User } from "../models/user";

export async function findByEmail(email: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, email, name, created_at::text AS created_at FROM users WHERE email = $1`,
    [email]
  );
  return rows[0] ?? null;
}

export async function findById(id: string): Promise<User | null> {
  const { rows } = await query<User>(
    `SELECT id, email, name, created_at::text AS created_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/** Returns only the hash for password verification (never leaked via API). */
export async function getPasswordHashByEmail(
  email: string
): Promise<string | null> {
  const { rows } = await query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE email = $1`,
    [email]
  );
  return rows[0]?.password_hash ?? null;
}