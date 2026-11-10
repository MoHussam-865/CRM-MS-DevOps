// lib/config.ts — typed environment variables

import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().default("postgresql://user:password@postgres:5432/crm"),
  NOTIFICATION_SERVICE_URL: z.string().default("http://notification-service:5000"),
  JWT_SECRET: z.string().default("change-me"),
  ADMIN_EMAIL: z.string().default("admin@crm.local"),
  ADMIN_PASSWORD: z.string().default("admin123"),
});

export type Config = z.infer<typeof envSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (!_config) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
      process.exit(1);
    }
    _config = parsed.data;
  }
  return _config;
}