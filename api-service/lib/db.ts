// lib/db.ts — PostgreSQL connection pool

import pg from "pg";
import { getConfig } from "./config";

let _pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!_pool) {
    const config = getConfig();
    _pool = new pg.Pool({ connectionString: config.DATABASE_URL });
  }
  return _pool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: pg.QueryConfig["values"]
): Promise<pg.QueryResult<T>> {
  const pool = getPool();
  return pool.query<T>(text, params);
}

export async function closePool(): Promise<void> {
  if (_pool) {
    await _pool.end();
    _pool = null;
  }
}