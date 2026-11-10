-- 001_init.sql — initial schema + dev seed admin
-- Depends on pgcrypto extension for password hashing.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ── users ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── companies ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  industry   TEXT,
  phone      TEXT,
  website    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── customers ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  position   TEXT,
  status     TEXT NOT NULL DEFAULT 'Lead' CHECK (status IN ('Lead', 'Customer', 'Inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── tasks ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  description TEXT,
  priority    TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
  status      TEXT NOT NULL DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
  due_date    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── seed admin user (idempotent) ───────────────────────
INSERT INTO users (email, password_hash, name)
VALUES (
  'admin@crm.local',
  crypt('admin123', gen_salt('bf')),
  'Admin'
)
ON CONFLICT (email) DO NOTHING;