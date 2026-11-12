// scripts/migrate.ts — run migrations against the configured database, then seed
// Usage: npm run migrate

import { runMigrations } from "../lib/migrate";
import { seed } from "./seed";
import { closePool } from "../lib/db";

async function main() {
  console.log("Running migrations ...");
  await runMigrations();
  console.log("Seeding data ...");
  await seed();
  await closePool();
  console.log("Done.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});