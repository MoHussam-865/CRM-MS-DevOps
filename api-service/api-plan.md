# API Service — Plan & Reference

> **Read this first.** This file is the single source of truth for how the `api-service`
> (this folder) should be built and how it fits into the wider `microcrm` project.
> Every future AI agent (including a future "you") must read this file, `README.md`,
> and `instructions.md` before writing any code.

---

## 1. Purpose of this file

This document:

1. Summarizes the project goal and the rules that apply to this service.
2. Captures the current state of the codebase (empty Next.js scaffold).
3. Documents the key design decisions for the API service.
4. Lays out a concrete, minimal, ordered plan to reach a working API service
   that integrates with the other services (frontend + notification-service + PostgreSQL).

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
microcrm/  (repo root = d:/archive/temp/CRM-MS-DevOps)
├── frontend/                  # Next.js (UI only)
├── api-service/               # Next.js API service  <-- THIS FOLDER
├── notification-service/      # Node.js service
├── docs/
├── docker-compose.yml
└── README.md
```

> **Naming note:** the README/instructions refer to the API service folder as `api/`,
> but the actual folder on disk is `api-service/`. Keep `api-service` as the canonical
> folder name (Docker image name `api`, Kubernetes service `api-service`, etc. — see §11).

### Architecture

```
Internet → Ingress → Frontend (Next.js) → REST → API Service (Next.js)
                                                    ├──→ PostgreSQL
                                                    └──→ Notification Service
```

### This service's responsibility (API Service)

The API service owns **all business logic**:

- Authentication (simple JWT login, seeded admin user)
- CRUD for Companies, Customers, Tasks
- Input validation
- Database access (PostgreSQL)
- Calling the Notification Service on relevant events

It must **not** render UI. It is a pure JSON API.

---

## 3. Rules that must be followed (from instructions.md)

These are the "project constitution" for AI agents:

- **Best practices** — understand existing architecture, reuse patterns, avoid unnecessary deps.
- **Code quality** — clean, readable, small functions, clear naming, separation of concerns,
  strong typing. Avoid magic numbers, hardcoded values, god classes, large files.
- **Pattern** — the API must follow **Controller → Service → Repository**.
  Controllers must not contain business logic.
- **Environment variables** — never hardcode URLs, passwords, secrets, or DB connections.
  Always read from `process.env` / `.env`.
- **API shape** — validate input; return consistent responses:
  - Success: `{ "success": true, "data": {} }`
  - Error: `{ "success": false, "message": "..." }`
- **Database** — use migrations. Never hand-edit production DBs. Schema changes = migration file.
- **Security** — never commit `.env` (already covered by `.gitignore`), passwords, or secrets.
- **Docker** — every service needs a `Dockerfile` and `.dockerignore`; multi-stage builds;
  run as non-root when possible; keep images small.
- **Before finishing any task** — verify code compiles, tests pass, Docker build works,
  existing functionality is not broken, docs updated.
- **When adding features** — explain what files change, why, and architectural impact.
  No large changes without explanation.

---

## 4. Current state of this folder

This folder was created with:

```bash
npx create-next-app@latest app-name --ts --tailwind --eslint --app --use-npm
```

It is an **empty, untouched** Next.js scaffold. Verified versions:

| Dependency | Version |
|---|---|
| `next` | 16.4.6 |
| `react` / `react-dom` | 19.3.0 |
| `tailwindcss` (+ `@tailwindcss/turbopack`) | 4.3.3 |
| `typescript` | ^5 |
| `eslint` + `eslint-config-next` | ^9 / 16.4.6 |

Current files of note:

- `app/layout.tsx`, `app/page.tsx`, `app/globals.css` — boilerplate UI (will be trimmed).
- `next.config.ts` — has `cacheComponents`, `partialPrefetching`, and a `turbopack` CSS rule.
- `package.json` — scripts: `dev`, `build`, `start`, `lint`.
- `.gitignore` — already ignores `.env*` and `.next/`.
- `AGENTS.md` — Next.js agent rules (see warning below).

### ⚠️ Critical warning — Next.js 16 has breaking changes

`AGENTS.md` explicitly states:

> This is NOT the Next.js you know. This version has breaking changes — APIs, conventions,
> and file structure may differ from training data. Read the relevant guide in
> `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

The docs exist locally at `node_modules/next/dist/docs/` (`01-app`, `02-pages`,
`03-architecture`, `04-community`). **Before implementing route handlers, read the
`01-app` routing / route-handler docs** to confirm the current API surface
(route handler signatures, `params` handling, dynamic route segments, etc.).

---

## 5. Design decisions for this service

These are deliberate, minimal choices. Do not swap them without a strong reason.

### 5.1 Libraries to add (minimal set)

| Concern | Choice | Why |
|---|---|---|
| Postgres driver | `pg` (`node-postgres`) | Minimal, no codegen, transparent SQL. |
| JWT | `jsonwebtoken` | Standard, simple. |
| Password hashing | `bcryptjs` | Pure JS — no native build issues in Docker. |
| Validation / DTOs | `zod` | Lightweight, type-safe, replaces hand-rolled validation. |
| HTTP to notification svc | native `fetch` (Node 20+) | No `axios` dependency needed. |
| Dev types | `@types/pg`, `@types/jsonwebtoken`, `@types/bcryptjs` | Type safety. |

Deliberately **not** used: an ORM (Prisma/Drizzle), Redis, queues, email, etc.
Keep raw SQL + a tiny migration runner.

### 5.2 Proposed folder structure

```
api-service/
├── app/
│   ├── api/
│   │   ├── health/route.ts              # GET /api/health (for Docker/K8s probes)
│   │   ├── login/route.ts               # POST /api/login
│   │   ├── me/route.ts                  # GET  /api/me
│   │   ├── companies/route.ts           # GET/POST  /api/companies
│   │   ├── companies/[id]/route.ts      # PUT/DELETE /api/companies/:id
│   │   ├── customers/route.ts           # GET/POST  /api/customers
│   │   ├── customers/[id]/route.ts      # PUT/DELETE /api/customers/:id
│   │   ├── tasks/route.ts               # GET/POST  /api/tasks
│   │   ├── tasks/[id]/route.ts          # PUT/DELETE /api/tasks/:id
│   │   └── notifications/route.ts       # GET /api/notifications (proxy to notif svc)
│   ├── layout.tsx                       # trimmed (can stay minimal)
│   ├── page.tsx                         # minimal "API service" placeholder/health text
│   └── globals.css
├── lib/
│   ├── config.ts                        # typed env access (PORT, DATABASE_URL, ...)
│   ├── db.ts                            # pg Pool singleton
│   ├── migrate.ts                       # tiny migration runner (applies lib/migrations/*)
│   ├── migrations/
│   │   └── 001_init.sql                 # users, companies, customers, tasks + seed admin
│   ├── models/                          # TS types + zod schemas (DTOs)
│   │   ├── user.ts
│   │   ├── company.ts
│   │   ├── customer.ts
│   │   ├── task.ts
│   │   └── notification.ts
│   ├── repositories/                    # data access (SQL lives here)
│   │   ├── userRepository.ts
│   │   ├── companyRepository.ts
│   │   ├── customerRepository.ts
│   │   └── taskRepository.ts
│   ├── services/                        # business logic
│   │   ├── authService.ts
│   │   ├── companyService.ts
│   │   ├── customerService.ts
│   │   ├── taskService.ts
│   │   └── notificationClient.ts        # calls notification-service via fetch
│   └── utils/
│       ├── response.ts                  # ok(data) / fail(message) helpers
│       └── auth.ts                      # JWT sign/verify + request auth helper
├── .env.example                         # committed template
├── .env                                 # local dev only (gitignored)
├── .dockerignore
├── Dockerfile                           # multi-stage
└── (existing Next.js files)
```

**Pattern mapping (Next.js idiom):**

- **Controllers** = route handlers in `app/api/**/route.ts`. They must stay thin:
  parse/validate input → call a service → return `ok()`/`fail()`.
- **Services** = `lib/services/*` — all business logic, orchestration, notification triggers.
- **Repositories** = `lib/repositories/*` — all SQL / DB access.
- **Models** = `lib/models/*` — TypeScript types + zod schemas (DTO validation).

### 5.3 Environment variables

`.env.example` (committed):

```
PORT=4000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
NOTIFICATION_SERVICE_URL=http://notification-service:5000
JWT_SECRET=change-me
```

Notes:

- **Never hardcode** these values. Always read via `lib/config.ts`.
- Service-to-service URLs use **service names, not localhost** when run in Docker/K8s:
  - DB: `postgres:5432` (compose) / `postgres-service:5432` (K8s)
  - Notification: `http://notification-service:5000`
- Local dev (outside Docker) can point `DATABASE_URL` at `localhost:5432` and
  `NOTIFICATION_SERVICE_URL` at `http://localhost:5000`.

### 5.4 Consistent response shape

Always return:

```json
// success (most endpoints)
{ "success": true, "data": { ... } }

// success (DELETE — no body)
{ "success": true, "message": "Deleted" }

// error
{ "success": false, "message": "Invalid request" }
```

Specific shapes to match the frontend contract:

- `GET /api/me` → `{ "success": true, "data": { "user": { id, email, name } } }`
- `DELETE` → `{ "success": true, "message": "Deleted" }` (no `data` key)

Use `lib/utils/response.ts` helpers (`ok`, `fail`) and appropriate HTTP status codes.

---

## 6. Database schema

Single PostgreSQL instance shared by the monorepo. This service owns the following tables.
Use UUID primary keys (simplest to generate app-side, avoids serial coupling).
Add `created_at TIMESTAMPTZ NOT NULL DEFAULT now()` to every table.

### users

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE NOT NULL | login identifier |
| password_hash | text NOT NULL | bcrypt |
| name | text | optional display name |
| created_at | timestamptz | default now() |

Seed one admin user (email/password from env, with documented dev defaults — see §9).

### companies

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| name | text NOT NULL | |
| industry | text | |
| phone | text | |
| website | text | |
| created_at | timestamptz | default now() |

### customers

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| company_id | uuid NOT NULL REFERENCES companies(id) | |
| name | text NOT NULL | |
| email | text | |
| phone | text | |
| position | text | |
| status | text NOT NULL | `Lead` \| `Customer` \| `Inactive` |
| created_at | timestamptz | default now() |

### tasks

| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| customer_id | uuid NOT NULL REFERENCES customers(id) | "Assigned to customer" |
| title | text NOT NULL | |
| description | text | |
| priority | text NOT NULL | `Low` \| `Medium` \| `High` |
| status | text NOT NULL | `Todo` \| `In Progress` \| `Done` |
| due_date | date | |
| created_at | timestamptz | default now() |

### notifications

> Owned by **notification-service**, which shares the same Postgres DB
> (`DATABASE_URL=.../crm`). The API service does **not** write this table directly —
> it triggers notifications by calling the notification service. The notification
> service stores: `title`, `message`, `created_at`.

---

## 7. API endpoints to implement

All under `/api`. Protected endpoints require a valid `Authorization: Bearer <token>` header
(except `POST /login` and `GET /health`).

> **Join fields:** `GET /api/customers` and `GET /api/tasks` may optionally include
> `company_name` / `customer_name` for display convenience. The frontend types only use
> `company_id` / `customer_id`, so extra fields are additive and safely ignored.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/login` | no | Body `{ email, password }` → `{ token, user }` |
| GET | `/api/me` | yes | Return current user → `{ success, data: { user } }` |

### Companies

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/companies` | yes | List all companies |
| POST | `/api/companies` | yes | Create company → **trigger notification** |
| PUT | `/api/companies/:id` | yes | Update company |
| DELETE | `/api/companies/:id` | yes | Delete company → `{ success, message }` |

### Customers

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/customers` | yes | List all customers (include company name) |
| POST | `/api/customers` | yes | Create customer → **trigger notification** |
| PUT | `/api/customers/:id` | yes | Update customer |
| DELETE | `/api/customers/:id` | yes | Delete customer → `{ success, message }` |

### Tasks

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | yes | List all tasks (include customer name) |
| POST | `/api/tasks` | yes | Create task → **trigger notification** (task assigned) |
| PUT | `/api/tasks/:id` | yes | Update task → if status becomes `Done`, **trigger notification** (task completed) |
| DELETE | `/api/tasks/:id` | yes | Delete task → `{ success, message }` |

### Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | yes | Proxy → `GET {NOTIFICATION_SERVICE_URL}/notifications`, return list |

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | `{ "status": "ok" }` for Docker/K8s readiness & liveness probes |

---

## 8. Notification integration

The API calls the notification service with native `fetch`. Wrap it in
`lib/services/notificationClient.ts`. Fire-and-forget with graceful failure:
if the notification service is down, **log the error but do not fail the main request**.

Notifications are triggered when:

1. Customer created
2. Company created
3. Task assigned (task created)
4. Task completed (task status transitioned to `Done`)

Call shape:

```
POST {NOTIFICATION_SERVICE_URL}/notify
Body: { "title": "...", "message": "..." }
```

`GET /api/notifications` proxies to `GET {NOTIFICATION_SERVICE_URL}/notifications`.

---

## 9. Plan phases (minimal path to a working service)

Work through these in order. Each phase is small and independently verifiable.

### Phase 0 — Reconfirm tooling & read the Next.js 16 docs
- Skim `node_modules/next/dist/docs/01-app` for route handlers and dynamic route `params`.
- Run `npm install` (already done) and `npm run build` to confirm the scaffold compiles.
- **Verify:** `npm run dev` starts and `/` serves the boilerplate page.

### Phase 1 — Foundations: config, DB, migrations
- Add deps: `pg`, `jsonwebtoken`, `bcryptjs`, `zod` (+ `@types/*`).
- Create `.env.example` and a gitignored `.env` for local dev.
- Implement `lib/config.ts` (typed env), `lib/db.ts` (pg Pool), `lib/migrate.ts`.
- Write `lib/migrations/001_init.sql` (tables + seeded admin user) and run it.
- **Verify:** migration creates tables; a quick script/`psql` check shows the admin row.

### Phase 2 — Response + auth utilities
- `lib/utils/response.ts` (`ok`/`fail`).
- `lib/utils/auth.ts` (sign/verify JWT, extract user from request).
- `lib/models/user.ts` + zod schema; `lib/repositories/userRepository.ts`.
- **Verify:** small local script signs + verifies a token and hashes a password.

### Phase 3 — Auth endpoints
- `POST /api/login` and `GET /api/me` (thin route handlers → `authService`).
- **Verify (curl):**
  - `curl -X POST localhost:4000/api/login -d '{"email":"admin@...","password":"..."}' -H 'Content-Type: application/json'` returns a token.
  - `GET /api/me` with the token returns the user.

### Phase 4 — Companies CRUD
- `lib/models/company.ts`, `lib/repositories/companyRepository.ts`,
  `lib/services/companyService.ts`, and the `companies` + `companies/[id]` route handlers.
- Add company-created notification trigger (stub the client first if notification svc isn't ready).
- **Verify (curl):** full CRUD works and returns the consistent `{success, data}` shape.

### Phase 5 — Customers CRUD
- Same layering for customers; validate `company_id` exists; include company name in reads.
- Add customer-created notification trigger.
- **Verify (curl):** CRUD works, `company_id` FK enforced, notifications triggered.

### Phase 6 — Tasks CRUD
- Same layering; include customer name in reads; enforce `priority`/`status` enums via zod.
- Add task-assigned trigger on create and task-completed trigger on `Done` transition.
- **Verify (curl):** CRUD works; completing a task triggers a notification.

### Phase 7 — Notifications proxy + health
- `GET /api/notifications` proxies to notification service.
- `GET /api/health`.
- **Verify:** health returns ok; notifications endpoint returns data when notification svc is up.

### Phase 8 — Trim UI + Docker
- Replace `app/page.tsx` boilerplate with a minimal "API service running" placeholder.
- Add `Dockerfile` (multi-stage) and `.dockerignore`.
- **Verify:** `docker build` succeeds; image runs and `/api/health` responds.
  (Full `docker compose up` is orchestrated at the repo root, not here.)

### Phase 9 — Final verification (definition of done)
- `npm run lint` clean, `npm run build` succeeds.
- All endpoints return the consistent response shape and validate input.
- `.env` is **not** committed; `.env.example` is up to date.
- Service reaches PostgreSQL and the notification service using service names (not localhost)
  when running under Docker.

---

## 10. Out of scope (do not add)

From the README — keep these out:

- Multi-tenant orgs, email, SMS, OAuth, WebSockets, RabbitMQ/Kafka, Redis, file uploads,
  payments, complex reporting, RBAC beyond simple admin/user, CI/CD pipelines (later enhancement).

---

## 11. Quick reference — ports & service names

| Service | Tech | Container port | Local port | In-Docker address |
|---|---|---|---|---|
| Frontend | Next.js | 3000 | 3000 | `http://frontend:3000` |
| **API Service** | Next.js API | 4000 | 4000 | `http://api:4000` (K8s: `api-service`) |
| Notification | Node.js | 5000 | 5000 | `http://notification-service:5000` |
| PostgreSQL | PostgreSQL | 5432 | 5432 | `postgres:5432` (K8s: `postgres-service`) |

Env for this service:

```
PORT=4000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
NOTIFICATION_SERVICE_URL=http://notification-service:5000
JWT_SECRET=change-me
```

---

## 12. Verification checklist for any future change

Before considering any task done, confirm:

1. `npm run lint` passes.
2. `npm run build` passes.
3. `docker build` works (once Dockerfile exists).
4. Endpoints still return `{ success, data | message }`.
5. No secrets/URLs hardcoded; all via env.
6. New SQL changes have a migration file.
7. This `plan.md` is updated if the plan or decisions change.







