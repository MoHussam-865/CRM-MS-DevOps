// lib/repositories/taskRepository.ts — task DB queries

import { query } from "../db";
import type { Task } from "../models/task";

const COLS = `t.id, t.customer_id, t.title, t.description, t.priority, t.status, t.due_date::text AS due_date, t.created_at::text AS created_at`;
const JOIN_COLS = `${COLS}, cu.name AS customer_name`;

export async function findAll(): Promise<Task[]> {
  const { rows } = await query<Task>(
    `SELECT ${JOIN_COLS}
     FROM tasks t
     LEFT JOIN customers cu ON cu.id = t.customer_id
     ORDER BY t.created_at DESC`
  );
  return rows;
}

export async function findById(id: string): Promise<Task | null> {
  const { rows } = await query<Task>(
    `SELECT ${JOIN_COLS}
     FROM tasks t
     LEFT JOIN customers cu ON cu.id = t.customer_id
     WHERE t.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function create(data: {
  customer_id: string;
  title: string;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  due_date?: string | null;
}): Promise<Task> {
  const { rows } = await query<Task>(
    `INSERT INTO tasks (customer_id, title, description, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLS}`,
    [
      data.customer_id,
      data.title,
      data.description ?? null,
      data.priority ?? "Medium",
      data.status ?? "Todo",
      data.due_date ?? null,
    ]
  );
  return findById(rows[0].id) as Promise<Task>;
}

export async function update(
  id: string,
  data: {
    customer_id?: string;
    title?: string;
    description?: string | null;
    priority?: string | null;
    status?: string | null;
    due_date?: string | null;
  }
): Promise<Task | null> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  let idx = 1;

  if (data.customer_id !== undefined) { sets.push(`customer_id = $${idx++}`); vals.push(data.customer_id); }
  if (data.title !== undefined) { sets.push(`title = $${idx++}`); vals.push(data.title); }
  if (data.description !== undefined) { sets.push(`description = $${idx++}`); vals.push(data.description ?? null); }
  if (data.priority !== undefined) { sets.push(`priority = $${idx++}`); vals.push(data.priority); }
  if (data.status !== undefined) { sets.push(`status = $${idx++}`); vals.push(data.status); }
  if (data.due_date !== undefined) { sets.push(`due_date = $${idx++}`); vals.push(data.due_date ?? null); }

  if (sets.length === 0) {
    return findById(id);
  }

  vals.push(id);
  const { rows } = await query<Task>(
    `UPDATE tasks t SET ${sets.join(", ")} WHERE t.id = $${idx}`,
    vals
  );
  if (rows.length === 0) return null;
  return findById(id);
}

export async function remove(id: string): Promise<boolean> {
  const { rowCount } = await query("DELETE FROM tasks WHERE id = $1", [id]);
  return (rowCount ?? 0) > 0;
}