// lib/migrate.ts — run .sql migration files sequentially

import fs from "node:fs";
import path from "node:path";
import { query, getPool } from "./db";

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

export async function runMigrations(): Promise<void> {
  // Ensure the migrations tracking table exists
  await query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const { rows } = await query<{ exists: boolean }>(
      `SELECT EXISTS (SELECT 1 FROM _migrations WHERE name = $1) AS exists`,
      [file]
    );
    if (rows[0].exists) {
      console.log(`  ↻ ${file} already applied, skipping`);
      continue;
    }

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf-8");
    console.log(`  → ${file} ...`);

    // Run inside a transaction
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`  ✓ ${file} applied`);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(`  ✗ ${file} FAILED:`, err);
      throw err;
    } finally {
      client.release();
    }
  }
}