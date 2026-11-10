// scripts/verify-auth.ts — run off-line to test sign/verify + bcrypt hash
// Usage: npx tsx scripts/verify-auth.ts

import { signToken, verifyToken } from "../lib/utils/auth";
import bcrypt from "bcryptjs";

function main() {
  // ── bcrypt round-trip ──
  const password = "admin123";
  const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
  const match = bcrypt.compareSync(password, hash);
  console.log(`bcrypt: password="${password}" → hash match=${match}`);
  if (!match) process.exit(1);

  // ── JWT round-trip ──
  const payload = { sub: "00000000-0000-0000-0000-000000000000", email: "admin@crm.local" };
  const token = signToken(payload);
  const decoded = verifyToken(token);
  const ok = decoded.sub === payload.sub && decoded.email === payload.email;
  console.log(`JWT:   token valid=${ok}  sub=${decoded.sub}  email=${decoded.email}`);
  if (!ok) process.exit(1);

  console.log("\n✓ All auth primitives work correctly.");
}

main();