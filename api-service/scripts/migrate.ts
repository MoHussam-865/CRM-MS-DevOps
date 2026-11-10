// scripts/migrate.ts — run migrations against the configured database
// Usage: npm run migrate

import { runMigrations } from "../lib/migrate";
import { closePool } from "../lib/db";

async function main() {
  console.log("Running migrations ...");
  await runMigrations();
  await closePool();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});