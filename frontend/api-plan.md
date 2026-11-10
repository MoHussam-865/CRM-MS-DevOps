# API Service — Plan & Reference (Frontend Reference Copy)

> **This is a reference document copied from `api-service/api-plan.md`.**
> It describes the API contract that the frontend consumes — it is NOT a plan
> for frontend work. See `frontend-plan.md` for the frontend's plan and current state.
>
> ✅ **All API endpoints listed here are consumed by the frontend** (except `/api/health`).
> The frontend uses `/api` prefix as documented.

---

## 1. Purpose of this file

This document:
1. Summarizes the project goal and the rules that apply to this service.
2. Captures the current state of the API service codebase.
3. Documents key design decisions for the API service.
4. Lays out a concrete, minimal, ordered plan to build a working API service.

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
├── api-service/               # Next.js API service  <-- THIS FILE'S SUBJECT
├── notification-service/      # Node.js service
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

### This service's responsibility (API Service)

The API service owns **all business logic**:

- Authentication (simple JWT login, seeded admin user)
- CRUD for Companies, Customers, Tasks
- Input validation
- Database access (PostgreSQL)
- Calling the Notification Service on relevant events

It must **not** render UI. It is a pure JSON API.

---

## 3. Rules that must be followed

- **Best practices** — understand existing architecture, reuse patterns, avoid unnecessary deps.
- **Code quality** — clean, readable, small functions, clear naming, strong typing.
- **Pattern** — API must follow **Controller → Service → Repository**.
- **Environment variables** — never hardcode URLs, passwords, or secrets.
- **API shape** — consistent responses: `{ success, data }` or `{ success: false, message }`.
- **Database** — use migrations. Never hand-edit production DBs.
- **Security** — never commit `.env`, passwords, or secrets.
- **Docker** — every service needs a `Dockerfile` and `.dockerignore`; multi-stage builds.
- **Before finishing any task** — verify code compiles, tests pass, docs updated.

---

## 4. Current state of the API service

The `api-service/` folder was scaffolded with `npx create-next-app` and is an
**empty, untouched** Next.js project (no API code yet). This file documents the plan
to build the API service.

> **Frontend note:** For the frontend's current state (Phases 1–4 complete),
> see `frontend-plan.md §2`.

---
## 5. Design decisions for this service

### 5.1 Libraries to add

| Concern | Choice | Why |
|---|---|---|
| Postgres driver | `pg` | Minimal, no codegen. |
| JWT | `jsonwebtoken` | Standard, simple. |
| Password hashing | `bcryptjs` | Pure JS — no native build issues. |
| Validation / DTOs | `zod` | Lightweight, type-safe. |
| HTTP to notification svc | native `fetch` (Node 20+) | No extra dependency. |
| Dev types | `@types/pg`, `@types/jsonwebtoken`, `@types/bcryptjs` | Type safety. |

### 5.2 Proposed folder structure

```
api-service/
├── app/
│   ├── api/
│   │   ├── health/route.txt              # GET /api/health
│   │   ├── login/route.txt               # POST /api/login
│   │   ├── me/route.txt                  # GET  /api/me
│   │   ├── companies/route.txt           # GET/POST  /api/companies
│   │   ├── companies/[id]/route.txt      # PUT/DELETE /api/companies/:id
│   │   ├── customers/route.txt           # GET/POST  /api/customers
│   │   ├── customers/[id]/route.txt      # PUT/DELETE /api/customers/:id
│   │   ├── tasks/route.txt               # GET/POST  /api/tasks
│   │   ├── tasks/[id]/route.txt          # PUT/DELETE /api/tasks/:id
│   │   └── notifications/route.txt       # GET /api/notifications (proxy)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   ├── config.ts
│   ├── db.ts
│   ├── migrate.ts
│   ├── migrations/001_init.sql
│   ├── models/ (user, company, customer, task, notification)
│   ├── repositories/ (user, company, customer, task)
│   ├── services/ (auth, company, customer, task, notificationClient)
│   └── utils/ (response.ts, auth.ts)
├── .env.example
├── .env (gitignored)
├── .dockerignore
├── Dockerfile
└── (existing Next.js files)
```

### 5.3 Environment variables

```
PORT=4000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
NOTIFICATION_SERVICE_URL=http://notification-service:5000
JWT_SECRET=change-me
```

### 5.4 Consistent response shape

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Invalid request" }
```

---

## 6. Database schema

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| email | text UNIQUE NOT NULL | login identifier |
| password_hash | text NOT NULL | bcrypt |
| name | text | optional |
| created_at | timestamptz | default now() |

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
| customer_id | uuid NOT NULL REFERENCES customers(id) | |
| title | text NOT NULL | |
| description | text | |
| priority | text NOT NULL | `Low` \| `Medium` \| `High` |
| status | text NOT NULL | `Todo` \| `In Progress` \| `Done` |
| due_date | date | |
| created_at | timestamptz | default now() |

### notifications
> Owned by notification-service. The API service triggers notifications by calling the
> notification service — never writes to this table directly.

---
## 7. API endpoints

All under `/api`. Protected endpoints require valid `Authorization: Bearer <token>` header
(except `POST /login` and `GET /health`).

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/login` | no | Body `{ email, password }` → `{ token, user }` |
| GET | `/api/me` | yes | Return current user from token |

### Companies
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/companies` | yes | List all companies |
| POST | `/api/companies` | yes | Create → trigger notification |
| PUT | `/api/companies/:id` | yes | Update company |
| DELETE | `/api/companies/:id` | yes | Delete company |

### Customers
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/customers` | yes | List all (include company name) |
| POST | `/api/customers` | yes | Create → trigger notification |
| PUT | `/api/customers/:id` | yes | Update customer |
| DELETE | `/api/customers/:id` | yes | Delete customer |

### Tasks
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks` | yes | List all (include customer name) |
| POST | `/api/tasks` | yes | Create → trigger notification (task assigned) |
| PUT | `/api/tasks/:id` | yes | Update → if `Done`, trigger notification (task completed) |
| DELETE | `/api/tasks/:id` | yes | Delete task |

### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notifications` | yes | Proxy → `GET {NOTIFICATION_SERVICE_URL}/notifications` |

### Health
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | `{ "status": "ok" }` for probes |

---

## 8. Notification integration

Wrap calls in `lib/services/notificationClient.ts`. Fire-and-forget with graceful failure:
if notification service is down, log the error but do not fail the main request.

Notifications triggered when:
1. Customer created
2. Company created
3. Task assigned (task created)
4. Task completed (status → `Done`)

Call shape: `POST {NOTIFICATION_SERVICE_URL}/notify` with `{ title, message }`.

---

## 9. Plan phases (API service)

### Phase 0 — Reconfirm tooling & read Next.js 16 docs
### Phase 1 — Foundations: config, DB, migrations
### Phase 2 — Response + auth utilities
### Phase 3 — Auth endpoints (POST /api/login, GET /api/me)
### Phase 4 — Companies CRUD
### Phase 5 — Customers CRUD
### Phase 6 — Tasks CRUD
### Phase 7 — Notifications proxy + health
### Phase 8 — Trim UI + Docker
### Phase 9 — Final verification

---

## 10. Out of scope

Multi-tenant orgs, email, SMS, OAuth, WebSockets, RabbitMQ/Kafka, Redis, file uploads,
payments, complex reporting, RBAC beyond simple admin/user, CI/CD pipelines.

---

## 11. Quick reference — ports & service names

| Service | Tech | Container port | Local port | In-Docker address |
|---|---|---|---|---|
| Frontend | Next.js | 3000 | 3000 | `http://frontend:3000` |
| API Service | Next.js API | 4000 | 4000 | `http://api:4000` (K8s: `api-service`) |
| Notification | Node.js | 5000 | 5000 | `http://notification-service:5000` |
| PostgreSQL | PostgreSQL | 5432 | 5432 | `postgres:5432` (K8s: `postgres-service`) |

Env for the API service:
```
PORT=4000
DATABASE_URL=postgresql://user:password@postgres:5432/crm
NOTIFICATION_SERVICE_URL=http://notification-service:5000
JWT_SECRET=change-me
```

---

## 12. Verification checklist

Before considering any task done, confirm:
1. `npm run lint` passes.
2. `npm run build` passes.
3. `docker build` works (once Dockerfile exists).
4. Endpoints return `{ success, data | message }`.
5. No secrets/URLs hardcoded.
6. New SQL changes have a migration file.
7. This `plan.md` is updated if the plan or decisions change.