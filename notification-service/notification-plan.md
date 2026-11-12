# Notification Service — Plan & Reference

> **Read this first.** This file is the single source of truth for how the `notification-service`
> (this folder) should be built and how it fits into the wider `microcrm` project.
> Every future AI agent (including a future "you") must read this file, `README.md`,
> `instructions.md`, and `api-plan.md` before writing any code.

---

## 1. Purpose of this file

This document:

1. Summarizes the project goal and the rules that apply to this service.
2. Captures the current state of the codebase (Next.js scaffold — needs to be replaced).
3. Documents the key design decisions for the notification service.
4. Lays out a concrete, minimal, ordered plan to build a working notification service
   that integrates with the API service and PostgreSQL.
5. Defines the exact API contract the notification service must honor (driven by the
   API service's `notificationClient.ts`).

It is intended to be re-read at the start of every future work session.

---

## 2. What this project is (context from README.md)

The project is **not** a real CRM product. It is a **DevOps practice project** whose goal is
to demonstrate, in a production-like but intentionally simple way:

- Microservices architecture
- Docker / Docker Compose / Docker Hub
- Kubernetes
- Terraform / Ansible / Monitoring
- Clean project organization
- API communication between services

The CRM itself stays intentionally simple. Do **not** add complexity, extra services, or
technologies that are not required.

### Monorepo layout

```
microcrm/  (repo root = d:/programs/VMs/shared/CRM-MS-DevOps)
├── frontend/                  # Next.js (UI only)
├── api-service/               # Next.js API service
├── notification-service/      # Node.js service  <-- THIS FOLDER
├── docs/
├── docker-compose.yml
└── README.md
```

### Architecture

```
Internet → Ingress → Frontend (Next.js) → REST → API Service (Next.js)
                                                    ├──→ PostgreSQL
                                                    └──→ Notification Service
```

### This service's responsibility (Notification Service)

The notification service is an **extremely small, independent** Node.js service:

- Receives notification requests from the API service (`POST /notify`)
- Stores notifications in a shared PostgreSQL database (table: `notifications`)
- Provides a read endpoint (`GET /notifications`) that the API service proxies to the frontend

It does **not**:
- Talk to the frontend directly
- Send emails, SMS, or push notifications
- Use Firebase, WebSockets, or message queues
- Have any authentication (all calls come from the API service internally, on the Docker/K8s network)

---

## 3. Rules that must be followed (from instructions.md)

These are the "project constitution" for AI agents:

- **Best practices** — understand existing architecture, reuse patterns, avoid unnecessary deps.
- **Code quality** — clean, readable, small functions, clear naming, separation of concerns,
  strong typing. Avoid magic numbers, hardcoded values, god classes, large files.
- **Environment variables** — never hardcode URLs, passwords, secrets, or DB connections.
  Always read from `process.env` / `.env`.
- **API shape** — consistent response format:
  - Success: `{ "success": true, "data": {} }`
  - Error: `{ "success": false, "message": "..." }`
- **Database** — use migrations. Never hand-edit production DBs. Schema changes = migration file.
- **Security** — never commit `.env`, passwords, or secrets.
- **Docker** — every service needs a `Dockerfile` and `.dockerignore`; multi-stage builds;
  run as non-root when possible; keep images small.
- **Before finishing any task** — verify code compiles, tests pass, Docker build works,
  existing functionality is not broken, docs updated.
- **When adding features** — explain what files change, why, and architectural impact.
  No large changes without explanation.

---

## 4. Current state — ✅ Complete

> The notification service is fully built and ready for integration testing. All phases
> 0–6 are complete.

Current contents:

```
notification-service/
├── src/
│   ├── index.ts                       # Entry point — Express app, migrates on startup
│   ├── config.ts                      # Typed env access (PORT, DATABASE_URL)
│   ├── db.ts                          # pg Pool singleton
│   ├── migrate.ts                     # Migration runner (importable + standalone)
│   ├── routes/
│   │   ├── notify.ts                  # POST /notify
│   │   └── notifications.ts           # GET /notifications
│   ├── repositories/
│   │   └── notificationRepository.ts  # SQL for notifications table
│   ├── services/
│   │   └── notificationService.ts     # Business logic (create, list)
│   ├── models/
│   │   └── notification.ts            # TS type + zod schema
│   ├── utils/
│   │   └── response.ts                # ok(data) / fail(message) helpers
│   └── migrations/
│       └── 001_create_notifications.sql
├── .env                                # Local dev (gitignored)
├── .env.example                        # Committed template
├── .dockerignore
├── .gitignore                          # Updated for Node.js project
├── Dockerfile                          # Multi-stage build
├── tsconfig.json                       # Plain Node.js config
├── eslint.config.mjs                   # typescript-eslint config
├── package.json                        # Minimal dependencies
├── (reference files kept: README.md, instructions.md, api-plan.md, frontend-plan.md)
└── notification-plan.md                # This file — updated
```

**Status of each phase:**

| Phase | Status |
|---|---|
| Phase 0 — Clean Next.js scaffold | ✅ DONE |
| Phase 1 — Foundations (config, DB, migration) | ✅ DONE |
| Phase 2 — Models, Repository & Service | ✅ DONE |
| Phase 3 — Routes & Express app | ✅ DONE |
| Phase 4 — Integration testing | 🟡 SKIPPED (manual, requires DB) |
| Phase 5 — Docker | ✅ DONE |
| Phase 6 — Final verification | ✅ DONE |

All checks pass:
- `npm run build` (tsc) — ✅ clean compile
- `npm run lint` — ✅ no warnings/errors
- `docker build` — pending (requires Docker Desktop)
- Response shapes — all endpoints return `{ success, data }` / `{ success, message }`

---

## 5. Design decisions for this service

These are deliberate, minimal choices. Do not swap them without a strong reason.

### 5.1 Technology stack

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js 20+ (TypeScript) | Standard, matches project ecosystem |
| HTTP framework | **Express.js** | Lightweight, minimal, well-known |
| Postgres driver | `pg` (`node-postgres`) | Same as API service; transparent SQL, no codegen |
| Validation | `zod` | Same as API service; lightweight, type-safe |
| UUID generation | `uuid` package | Generate primary keys app-side (matches API pattern) |
| Environment | `dotenv` | Load `.env` in development |
| Dev types | `@types/pg`, `@types/express`, `@types/uuid` | Type safety |
| Dev runner | `tsx` | Run TypeScript directly in dev without compile step |

Deliberately **not** used: Next.js, ORM (Prisma/Drizzle), Redis, queues, email, SMS, Firebase,
WebSockets, RabbitMQ/Kafka.

### 5.2 Runtime pattern

- **Development:** `tsx watch src/index.ts` — runs TypeScript directly with hot-reload
- **Production:** Compile with `tsc` → run compiled JS with `node dist/index.js`
- **Docker:** Multi-stage build — stage 1 compiles TS, stage 2 runs minimal JS image

### 5.3 Proposed folder structure (target)

```
notification-service/
├── src/
│   ├── index.ts                       # Entry point — Express app, listen on PORT
│   ├── config.ts                      # Typed env access (PORT, DATABASE_URL)
│   ├── db.ts                          # pg Pool singleton
│   ├── migrate.ts                     # Tiny migration runner
│   ├── routes/
│   │   ├── notify.ts                  # POST /notify
│   │   └── notifications.ts           # GET /notifications
│   ├── repositories/
│   │   └── notificationRepository.ts  # SQL for notifications table
│   ├── services/
│   │   └── notificationService.ts     # Business logic (create, list)
│   ├── models/
│   │   └── notification.ts            # TS type + zod schema
│   ├── utils/
│   │   └── response.ts                # ok(data) / fail(message) helpers
│   └── migrations/
│       └── 001_create_notifications.sql
├── .env.example                       # Committed template
├── .env                               # Local dev only (gitignored)
├── .dockerignore
├── Dockerfile                         # Multi-stage
├── tsconfig.json                      # Plain Node.js config
├── package.json                       # Minimal dependencies
└── (reference files kept: README.md, instructions.md, api-plan.md, frontend-plan.md)
```

Files to **delete** (Next.js scaffold): `app/`, `public/`, `AGENTS.md`, `next.config.ts`

Files to **keep** (reference): `README.md`, `instructions.md`, `api-plan.md`, `frontend-plan.md`

### 5.4 Environment variables

`.env.example` (committed):
```
PORT=5000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
```

`.env` (local dev, gitignored — same content as above but editable).

- **Never hardcode** these values. Always read via `src/config.ts`.
- Service-to-service URLs use **service names, not localhost** in Docker/K8s:
  - DB: `postgres:5432` (compose) / `postgres-service:5432` (K8s)
- Local dev (outside Docker) can point `DATABASE_URL` at `localhost:5432`.
- No `JWT_SECRET` needed — this service has no authentication (internal only).

### 5.5 Consistent response shape

Always return:
```json
// POST /notify — 201 Created
{ "success": true, "data": { "id": "...", "title": "...", "message": "...", "created_at": "..." } }

// GET /notifications — 200 OK
{ "success": true, "data": [ { ... }, { ... } ] }

// GET /health — 200 OK
{ "status": "ok" }

// Error
{ "success": false, "message": "Invalid request" }
```

> **Important:** The `GET /notifications` response is forwarded **verbatim** by the
> API service's proxy. The response shape must match what the frontend expects.

### 5.6 No authentication

---

## 6. Database schema — notifications table

The notification service **owns** the `notifications` table. It shares the same PostgreSQL
instance (`DATABASE_URL=.../crm`) as the API service, but the API service does **not** write
to this table directly — it only calls `POST /notify`.

### notifications

| Column | Type | Notes |
|---|---|---|
| id | UUID PRIMARY KEY | Generated app-side via `uuid` package |
| title | TEXT NOT NULL | Short title (e.g. "Company Created") |
| message | TEXT NOT NULL | Detail message (e.g. 'Company "Acme" was created.') |
| created_at | TIMESTAMPTZ NOT NULL | Default `now()` |

Migration SQL (`src/migrations/001_create_notifications.sql`):

```sql
-- 001_create_notifications.sql — notifications table for notification-service

CREATE TABLE IF NOT EXISTS notifications (
    id          UUID PRIMARY KEY,
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> **Note:** The API service's migration (`001_init.sql`) does **NOT** create the
> `notifications` table. This service's migration does. Both services share the `crm`
> database, and migrations from both services are idempotent (`IF NOT EXISTS`).

---

## 7. API endpoints to implement

### 7.1 POST /notify

**Purpose:** Called by the API service to create a notification.

**Request:**
```
POST /notify
Content-Type: application/json
{
  "title": "Company Created",
  "message": "Company \"Acme\" was created."
}
```

**Validation (zod):**
- `title`: string, required, non-empty
- `message`: string, required, non-empty

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Company Created",
    "message": "Company \"Acme\" was created.",
    "created_at": "2026-11-12T10:30:00.000Z"
  }
}
```

**Errors:**
```json
// 400 — validation error
{ "success": false, "message": "title is required" }

// 500 — database error
{ "success": false, "message": "Failed to store notification" }
```

**Integration note:** The API service calls this as **fire-and-forget** — it does not
`await` the result and catches any errors silently. The notification service should
still return proper status codes.

### 7.2 GET /notifications

**Purpose:** Returns all notifications, newest first. Proxied by API service to frontend.

**Request:** `GET /notifications`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-...",
      "title": "Task Completed",
      "message": "Task \"Follow up\" is completed.",
      "created_at": "2026-11-12T11:00:00.000Z"
    }
  ]
}
```

**Empty response:** `{ "success": true, "data": [] }`

**Error (500):** `{ "success": false, "message": "Failed to fetch notifications" }`

**Ordering:** Results ordered by `created_at DESC` (newest first).

### 7.3 GET /health

**Response (200 OK):** `{ "status": "ok" }`

No auth. No DB check needed — if the process is running, it's healthy.

---

## 8. Integration contract with API service

This section is the **binding contract** between the two services.

### 8.1 Call flow

```
API Service (notificationClient.ts)
    │  POST {NOTIFICATION_SERVICE_URL}/notify
    │  Body: { "title": "...", "message": "..." }
    │  Fire-and-forget (errors logged, never fails main request)
    ▼
Notification Service
    │  Validates input → inserts into DB → returns { success, data }
```

### 8.2 Notification triggers (from API service)

| Event | title | message |
|---|---|---|
| Company created | `"Company Created"` | `'Company "{name}" was created.'` |
| Customer created | `"Customer Created"` | `'Customer "{name}" was created.'` |
| Task assigned (created) | `"Task Assigned"` | `'Task "{title}" was assigned.'` |
| Task completed (status → Done) | `"Task Completed"` | `'Task "{title}" is completed.'` |

The notification service just stores whatever `title` and `message` it receives.

### 8.3 Proxy flow (GET /notifications)

```
Frontend → GET /api/notifications → API Service proxy → GET /notifications (this service)
                                                              │
                                              Returns { success, data: [...] }
                                              └── API forwards this JSON verbatim to frontend
```

**Critical:** The response must match what the frontend expects: an array of notification
objects inside `{ success: true, data: [...] }` with fields `id`, `title`, `message`, `created_at`.

### 8.4 Network addresses

| Context | API → Notification Service | DB URL |
|---|---|---|
| Local dev (outside Docker) | `http://localhost:5000` | `postgresql://...@localhost:5432/crm` |
| Docker Compose | `http://notification-service:5000` | `postgresql://...@postgres:5432/crm` |
---

## 9. Implementation phases

### Phase 0 — Clean up Next.js scaffold & set up Node.js project

**Goal:** Remove all Next.js artifacts and set up a plain Node.js TypeScript project.

**Tasks:**

1. Delete files/directories not needed:
   - `app/` (entire directory)
   - `public/` (entire directory)
   - `AGENTS.md`
   - `next.config.ts`
2. Rewrite `package.json` with minimal dependencies (see §5.1 for full list):
   - `express`, `pg`, `zod`, `uuid`, `dotenv`
   - Dev: `typescript`, `tsx`, `@types/*`, `eslint`, `typescript-eslint`
   - Scripts: `dev` (tsx watch), `build` (tsc), `start` (node dist), `lint` (eslint)
3. Rewrite `tsconfig.json` for plain Node.js (target ES2022, module commonjs, outDir dist, rootDir src)
4. Create minimal ESLint config
5. Run `npm install` to install new dependencies.
6. **Verify:** `npm run build` runs (tsc succeeds on empty or placeholder src).

**Files changed:** `package.json`, `tsconfig.json`, `eslint.config.mjs` (rewritten)
**Files deleted:** `app/`, `public/`, `AGENTS.md`, `next.config.ts`

---

### Phase 1 — Foundations (config, DB, migration)

**Goal:** Set up the core infrastructure: env config, database pool, and migration.

**Tasks:**

1. **`src/config.ts`** — Typed env access using `zod`:
   - `PORT`: number, default 5000
   - `DATABASE_URL`: string, default `postgresql://user:password@postgres:5432/crm`
2. **`src/db.ts`** — `pg.Pool` singleton, export pool, log connection errors but don't crash.
3. **`src/migrations/001_create_notifications.sql`** — as defined in §6.
4. **`src/migrate.ts`** — Simple migration runner:
   - Read `.sql` files from `src/migrations/`
   - Execute them in order via the Pool
   - Idempotent (`CREATE TABLE IF NOT EXISTS`)
   - Called on service startup

**Verify:** `npx tsx src/migrate.ts` runs without errors (requires PostgreSQL running).

**Files created:** `src/config.ts`, `src/db.ts`, `src/migrate.ts`, `src/migrations/001_create_notifications.sql`

---

### Phase 2 — Models, Repository & Service layer

**Goal:** Implement the data layer following same patterns as the API service.

**Tasks:**

1. **`src/utils/response.ts`** — `ok(data)` and `fail(message, status)` helpers.
2. **`src/models/notification.ts`** — TS type + zod schema:
   - `notifyInputSchema` for `{ title: string, message: string }`
   - `Notification` type for `{ id, title, message, created_at }`
3. **`src/repositories/notificationRepository.ts`** — Data access:
   - `create(title, message): Promise<Notification>` — INSERT with UUID, return created row
   - `findAll(): Promise<Notification[]>` — SELECT all, `ORDER BY created_at DESC`
4. **`src/services/notificationService.ts`** — Business logic:
   - `createNotification(title, message): Promise<Notification>` — validates, calls repo
   - `listNotifications(): Promise<Notification[]>` — calls repo

**Verify:** `npx tsc --noEmit` passes.

**Files created:** `src/utils/response.ts`, `src/models/notification.ts`, `src/repositories/notificationRepository.ts`, `src/services/notificationService.ts`

---

### Phase 3 — Routes & Express app

**Goal:** Wire up the Express routes and create the entry point.

**Tasks:**

1. **`src/routes/notify.ts`** — Express Router, `POST /notify`:
   - Parse body, validate with zod
   - Call `notificationService.createNotification()`
   - Return 201 with `ok({...})`, 400 on validation error, 500 on DB error
2. **`src/routes/notifications.ts`** — Express Router, `GET /notifications`:
   - Call `notificationService.listNotifications()`
   - Return 200 with `ok([...])`, 500 on DB error
3. **`src/index.ts`** — Entry point:
   - Load dotenv, create Express app, mount routes
   - Run migrations on startup
   - Health check at `GET /health`
   - Listen on `config.PORT`

**Verify:**
- `npm run dev` starts the server
- `curl -X POST http://localhost:5000/notify -H "Content-Type: application/json" -d '{"title":"Test","message":"Hello"}'` → 201
- `curl http://localhost:5000/notifications` → includes test notification
- `curl http://localhost:5000/health` → `{"status":"ok"}`
- `npm run build` passes

**Files created:** `src/routes/notify.ts`, `src/routes/notifications.ts`, `src/index.ts`

---

### Phase 4 — Integration testing with API service

**Goal:** Verify end-to-end communication between API service and notification service.

**Tasks:**

1. Start both services (notification on 5000, API on 4000)
2. Login via API, get JWT token
3. Create company → verify "Company Created" notification
4. Create customer → verify "Customer Created" notification
5. Create task → verify "Task Assigned" notification
6. Update task status to "Done" → verify "Task Completed" notification
7. Stop notification service → verify API still works (fire-and-forget)
8. Restart → verify notifications persisted in DB

**Verify:** All integration points work as expected.

---

### Phase 5 — Docker

**Goal:** Containerize the notification service.

**Tasks:**

1. **`.dockerignore`** — exclude `node_modules`, `dist`, `.env`, `.git`, markdown
2. **`Dockerfile`** — Multi-stage build:
   - Stage 1: `node:22-alpine`, npm ci, tsc compile
   - Stage 2: `node:22-alpine`, non-root user, copy dist + node_modules + migrations
   - EXPOSE 5000, CMD node dist/index.js
3. **Verify:** `docker build -t notification-service .` succeeds, container starts and responds.

**Files created:** `.dockerignore`, `Dockerfile`

---

### Phase 6 — Final verification

**Goal:** Confirm everything is clean and working.

**Tasks:**

1. `npm run lint` passes
2. `npm run build` (tsc) passes with no errors
3. `docker build` works
4. All endpoints return consistent response shapes
5. No secrets/URLs hardcoded; all via env
6. This `notification-plan.md` updated with completed status

**Final file inventory:**

```
notification-service/
├── src/
│   ├── index.ts
│   ├── config.ts
│   ├── db.ts
│   ├── migrate.ts
│   ├── routes/
│   │   ├── notify.ts
│   │   └── notifications.ts
│   ├── repositories/
│   │   └── notificationRepository.ts
│   ├── services/
│   │   └── notificationService.ts
│   ├── models/
│   │   └── notification.ts
│   ├── utils/
│   │   └── response.ts
│   └── migrations/
│       └── 001_create_notifications.sql
├── .env.example
├── .env (gitignored)
├── .dockerignore
├── Dockerfile
├── tsconfig.json
├── eslint.config.mjs
├── package.json
├── (reference files)
│   ├── README.md
│   ├── instructions.md
│   ├── api-plan.md
│   ├── frontend-plan.md
│   └── notification-plan.md  (this file)
└── .gitignore
```

---

## 10. Out of scope (do not add)

From the README — keep these out:

- Multi-tenant organizations
- Email sending (no SMTP, no SendGrid, no Nodemailer)
- SMS integrations
- Push notifications (no Firebase Cloud Messaging)
- OAuth (Google, GitHub, Microsoft)
- WebSockets (no real-time push)
- RabbitMQ / Kafka (no message queues — simple HTTP POST is enough)
- Redis caching
- File uploads
- Complex reporting
- Advanced permissions / RBAC
- CI/CD pipelines (later enhancement)

Also, specifically for this service:
- No authentication (internal service, calls from API service only)
- No frontend/UI (headless)
- No notification preference management
- No read/unread tracking
- No notification types or categories (just title + message)
- No pagination for GET /notifications (data volume is intentionally low)

---

## 11. Quick reference — ports & service names

| Service | Tech | Container Port | Local Port | In-Docker Address |
|---|---|---|---|---|
| Frontend | Next.js | 3000 | 3000 | `http://frontend:3000` |
| API Service | Next.js API | 4000 | 4000 | `http://api:4000` (K8s: `api-service`) |
| **Notification** | Node.js/Express | 5000 | 5000 | `http://notification-service:5000` |
| PostgreSQL | PostgreSQL | 5432 | 5432 | `postgres:5432` (K8s: `postgres-service`) |

Env for this service:
```
PORT=5000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
```

---

## 12. Verification checklist (for any future change)

Before considering any task done, confirm:

1. `npm run build` (tsc) passes.
2. `npm run lint` passes.
3. `docker build` works.
4. `POST /notify` returns `201 { success: true, data: { id, title, message, created_at } }`.
5. `GET /notifications` returns `200 { success: true, data: [...] }` ordered newest-first.
6. `GET /health` returns `200 { status: "ok" }`.
7. No secrets/URLs hardcoded; all via env.
8. New SQL changes have a migration file in `src/migrations/`.
9. API service integration still works (fire-and-forget doesn't break).
10. This `notification-plan.md` is updated if the plan or decisions change.

---

## 13. Troubleshooting & common issues

### 13.1 "ECONNREFUSED" from API service

The API service calls `POST /notify` as fire-and-forget. If the notification service isn't
running, the API logs the error but continues. Start the notification service first, then
the API service. Or start both — the fire-and-forget pattern means no data loss on
transient errors (except the notification itself isn't stored — that's intentional).

### 13.2 Database connection issues

The notification service shares the `crm` database with the API service. If the API service
migrations have already run, the `notifications` table may not exist yet — the notification
service's own migration (`001_create_notifications.sql`) creates it on startup.

Both services coexist in the same database because:
- API service owns: `users`, `companies`, `customers`, `tasks`
- Notification service owns: `notifications`
- No service writes to another service's tables

### 13.3 Port conflicts

If port 5000 is already in use, change `PORT` in `.env` to another value. Update the API
service's `NOTIFICATION_SERVICE_URL` accordingly.

### 13.4 Migration fails on startup

If the migration fails (e.g., database not reachable), the service logs the error and
crashes. This is intentional — the service cannot function without its table. Fix the
database connection and restart.

---

## 14. Differences from API service (important context)

This service is intentionally simpler than the API service:

| Aspect | API Service | Notification Service |
|---|---|---|
| Framework | Next.js App Router | Express.js |
| Pattern | Controller → Service → Repository | Route → Service → Repository |
| Auth | JWT on every endpoint | None (internal only) |
| Tables owned | users, companies, customers, tasks | notifications |
| Calls other services | Calls notification service | Does NOT call other services |
| Exposed to internet | Yes (via frontend) | No (internal only) |
| Frontend | No UI (pure API) | No UI (headless) |
| Dependencies | next, react, pg, zod, etc. | express, pg, zod, uuid, dotenv |