// scripts/seed.ts — seed the admin user from configurable env vars
// Usage: tsx scripts/seed.ts (called automatically by scripts/migrate.ts)
// Uses ADMIN_EMAIL and ADMIN_PASSWORD from environment (see lib/config.ts)

import bcrypt from "bcryptjs";
import { getConfig } from "../lib/config";
import { query, closePool } from "../lib/db";

async function seed() {
  const config = getConfig();
  const { ADMIN_EMAIL, ADMIN_PASSWORD } = config;

  console.log(`  → Seeding admin user: ${ADMIN_EMAIL}`);

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  await query(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, 'Admin')
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash`,
    [ADMIN_EMAIL, hash],
  );

  console.log(`  ✓ Admin user "${ADMIN_EMAIL}" seeded/updated`);
}

export { seed };

// When run standalone
if (require.main === module) {
  seed()
    .then(() => closePool())
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}