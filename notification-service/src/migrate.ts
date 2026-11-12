// src/migrate.ts — simple migration runner
// Can be imported from src/index.ts (pool stays open) or run standalone (pool is closed)

import fs from "fs";
import path from "path";
import { getConfig } from "./config";
import { query, closePool } from "./db";

export async function migrate(): Promise<void> {
  // Load config early to ensure env is valid
  getConfig();

  const migrationsDir = path.join(__dirname, "migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.error("❌ Migrations directory not found:", migrationsDir);
    process.exit(1);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("⚠️  No migration files found.");
    return;
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    console.log(`▶️  Running migration: ${file}`);
    try {
      await query(sql);
      console.log(`✅  Migration ${file} applied successfully.`);
    } catch (err) {
      console.error(`❌  Migration ${file} failed:`, err instanceof Error ? err.message : err);
      process.exit(1);
    }
  }
}

// When run standalone (npm run migrate), close pool after migration
if (require.main === module) {
  migrate()
    .then(() => closePool())
    .catch(() => process.exit(1));
}