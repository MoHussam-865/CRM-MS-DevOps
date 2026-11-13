# DevOps Guide — MicroCRM

> **Audience:** A DevOps engineer who needs to build, package, run, and deploy the
> MicroCRM project containerized.
>
> **Goal of this document:** Give you everything you need to understand the project
> at a glance, then build and run the full stack with Docker. It covers the project
> summary, the architecture, the multi-stage Dockerfiles, the recommended base
> images, the non-root hardening already applied, and the **public images you can
> pull directly** instead of building from source.

---

## Table of Contents

1. [Project Summary](#1-project-summary-30-second-overview)
2. [Ports & Networking](#2-ports--networking)
3. [The Dockerfiles (multi-stage)](#3-the-dockerfiles-all-multi-stage)
4. [Recommended Base Images](#4-recommended-base-images)
5. [Non-Root (Security Hardening)](#5-non-root-security-hardening--already-done)
6. [Environment Variables](#6-environment-variables-what-each-service-consumes)
7. [Build](#7-build)
8. [The Compose File](#8-the-compose-file-docker-composeyml)
9. [Run & Operate](#9-run--operate)
10. [Public Images You Can Use Directly](#10-public-images-you-can-use-directly-no-local-build)
11. [Production Checklist](#11-production-checklist-how-to-take-this-to-prod)

---

## 1. Project Summary (30-Second Overview)

MicroCRM is a **deliberately simple CRM** used as a teaching/showcase for a modern
microservices toolchain: Docker, Kubernetes, Terraform, Ansible, and monitoring.

The features are intentionally minimal. What matters is **clean project
organization and production-like deployment**, not feature depth.

```
├── frontend/               # Next.js (UI)      — Port 3000
├── api-service/            # Next.js API       — Port 4000  (business logic + DB)
├── notification-service/   # Node.js + Express — Port 5000  (internal)
│
├── docker-compose.yml      # Full stack
├── Dockerfile (in each service dir)
└── README.md
```

Four things are containerized:

| # | Service | Tech | Role |
|---|---|---|---|
| 1 | **frontend** | Next.js (App Router) | UI only. No DB access. Talks only to the API. |
| 2 | **api-service** (`api`) | Next.js (API routes) | Auth (JWT), CRUD, validation, DB, calls notification service |
| 3 | **notification-service** | Node.js + Express | Tiny. `POST /notify` + `GET /notifications` |
| 4 | **PostgreSQL** | Postgres 16 | Single database: `users, companies, customers, tasks, notifications` |

Architecture (intentionally simple — one DB, one API, one UI, one notifier):

```
                     Internet
                        │
                    Ingress
                        │
              Frontend (Next.js) ── 3000
                        │
                 /api/* → rewrite proxy
                        ▼
              API Service (Next.js) ── 4000
                ├──────────────┐
                ▼              ▼
          PostgreSQL     Notification Service ── 5000
             5432
```

**Key concept — the rewrite proxy:** the browser never calls the API directly. It
calls `/api/*` on the frontend's own origin (port 3000), and the Next.js server
proxies those requests to the backend via the internal Docker hostname `api:4000`.
This avoids browser-side hostname resolution problems entirely.

> **Out of scope (by design):** Redis, RabbitMQ/Kafka, WebSockets, email/SMS,
> OAuth, file uploads, payments, RBAC beyond a basic admin/user model, CI/CD.
> Don't expect them; don't add them unless the product owner explicitly asks.

---

## 2. Ports & Networking

| Service | Container Port | Host Port | Purpose |
|---|---|---|---|
| Frontend | 3000 | 3000 | User interface |
| API Service | 4000 | 4000 | Main backend |
| Notification Service | 5000 | 5000 | Internal notifications |
| PostgreSQL | 5432 | 5432 | Database |

Inside the Docker network, services resolve each other by **service name**
(`postgres`, `api`, `notification-service`, `frontend`).

---

## 3. The Dockerfiles (all multi-stage)

All three service images are **multi-stage** (builder → runner). This keeps the
final runtime image small and free of build-time tooling.

### 3.1 `frontend/Dockerfile` — base `node:20-alpine`

| Stage | What happens |
|---|---|
| **builder** | `WORKDIR /app`, `COPY package*.json`, `npm ci`, `COPY .`, `npm run build` |
| **runner** | `ENV NODE_ENV=production`, `ENV PORT=3000`, copies `.next`, `public`, `package.json`, `node_modules`, `next.config.ts`, then `USER node`, `EXPOSE 3000`, `CMD ["npm","start"]` |

### 3.2 `api-service/Dockerfile` — base `node:20-alpine`

Same pattern as frontend, plus copies `scripts`, `lib`, `tsconfig.json`. The
startup command is chained to **run DB migrations/seed first, then serve**:

```dockerfile
CMD ["sh", "-c", "npx tsx scripts/migrate.ts && npm start"]
```

`USER node`, `EXPOSE 4000`.

### 3.3 `notification-service/Dockerfile` — base `node:22-alpine`

Same pattern, but it builds a compiled `dist` (`npm run build` → tsc). Copies
`dist`, `node_modules`, `package.json`, and migrations into `dist/migrations`.
Runs as a **dedicated non-root user**:

```dockerfile
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
```

`EXPOSE 5000`, `CMD ["node","dist/index.js"]`.

### 3.4 Multi-stage benefits you should rely on

- **Layer caching:** `npm ci` runs before `COPY .`, so dependency layers are reused
  unless `package*.json` actually changes. Rebuilds are fast.
- **Smaller images:** build tooling and full source tree are discarded in the runner.
- **Deterministic deps:** `npm ci` (not `npm install`) uses the lockfile exactly.

---

## 4. Recommended Base Images

Stick to these (already used in the Dockerfiles / Compose). All Alpine-based for
small size:

| Image | Where used | Why |
|---|---|---|
| `node:20-alpine` | frontend, api | Matches the Next.js runtime used in the project |
| `node:22-alpine` | notification-service | Matches Node 22 in that service |
| `postgres:16-alpine` | Compose (not built) | Official, auto-creates DB/user/db, ships `pgcrypto` |

> **Pin a specific tag** for reproducibility. `node:20-alpine` and
> `postgres:16-alpine` are floating tags. For production, prefer a fixed digest
> (e.g. `postgres:16.4-alpine`) or an image digest so rebuilds are reproducible.

---

## 5. Non-Root (Security Hardening) — already done

Do **not** undo these. All application images drop to a non-root user before the
final `CMD`:

- `frontend` → `USER node` (built-in)
- `api` → `USER node` (built-in)
- `notification-service` → creates `appuser` + `appgroup`, then `USER appuser`

This satisfies the common Kubernetes/docker security expectation that containers
**must not run as root**. When you move these to Kubernetes/Ansible, keep:

- `runAsNonRoot: true`
- a numeric user/group that exists inside the image
- read-only root filesystem where practical (writes go to volumes)

---

## 6. Environment Variables (what each service consumes)

| Service | Variable | Required? | Docker value / default |
|---|---|---|---|
| **frontend** | `API_URL` | Yes | `http://api:4000` (used by rewrite proxy, server-side; **not** `NEXT_PUBLIC_`) |
| **api** | `PORT` | No | `4000` |
| **api** | `DATABASE_URL` | Yes | `postgresql://user:password@postgres:5432/crm` |
| **api** | `NOTIFICATION_SERVICE_URL` | Yes | `http://notification-service:5000` |
| **api** | `JWT_SECRET` | Yes | random strong string |
| **api** | `ADMIN_EMAIL` | No | `admin@crm.local` (seeded once) |
| **api** | `ADMIN_PASSWORD` | No | `admin123` (seeded once) |
| **notification-service** | `PORT` | No | `5000` |
| **notification-service** | `DATABASE_URL` | Yes | `postgresql://user:password@postgres:5432/crm` |
| **postgres** | `POSTGRES_USER` | Yes | `user` |
| **postgres** | `POSTGRES_PASSWORD` | Yes | `password` |
| **postgres** | `POSTGRES_DB` | Yes | `crm` |

> **Password consistency:** `POSTGRES_PASSWORD`, and the password embedded in
> `DATABASE_URL` for `api` and `notification-service`, must all match.
>
> **Production:** put `JWT_SECRET` and DB credentials in a secrets manager /
> Docker secrets — never hardcode them as done in `docker-compose.yml` (those are
> local-dev placeholders).

### DB bootstrap is automatic

- The official `postgres:16-alpine` image **auto-creates** the DB, user, and
  password from its `POSTGRES_*` env vars on first start — no manual `CREATE DATABASE`.
- On startup, **api** runs `001_init.sql` (creates `users`, `companies`,
  `customers`, `tasks`, enables `pgcrypto`, seeds the admin user), and
  **notification-service** runs `001_create_notifications.sql` (creates
  `notifications`). Both are idempotent (`CREATE TABLE IF NOT EXISTS`).
- Data persists in the `postgres_data` named volume.

---

## 7. Build

Build from the repository root. Image names match the Compose service names.

```bash
# One at a time
docker build -t frontend ./frontend
docker build -t api ./api-service
docker build -t notification-service ./notification-service

# All at once
docker build -t frontend ./frontend && \
docker build -t api ./api-service && \
docker build -t notification-service ./notification-service
```

---

## 8. The Compose File (`docker-compose.yml`)

The Compose stack runs all four services with correct startup ordering and health
checks:

| Order | Service | Depends on |
|---|---|---|
| 1 | `postgres` | — (own `pg_isready` healthcheck) |
| 2 | `notification-service` | `postgres` healthy (`service_healthy`) |
| 3 | `api` | `postgres` healthy + `notification-service` started |
| 4 | `frontend` | `api` started |

Notable details:

- `restart: unless-stopped` on every service.
- Named volume `postgres_data` → `/var/lib/postgresql/data`.
- Images referenced as `frontend:latest`, `api:latest`,
  `notification-service:latest` — see §10 for pulling prebuilt public images.

---

## 9. Run & Operate

```bash
# Start the whole stack (background)
docker compose up -d

# Status
docker compose ps

# Logs
docker compose logs -f
docker compose logs -f api

# Stop (keeps data)
docker compose down

# Reset everything including the database ("factory reset")
docker compose down -v

# Rebuild after code changes and restart
docker compose up -d --build
# or rebuild just one
docker compose build api && docker compose up -d api
```

### Verification

```bash
docker compose ps                      # expect 4 services "Up"
curl http://localhost:4000/api/health  # {"status":"ok"}
curl http://localhost:5000/health      # {"status":"ok"}

# Login
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm.local","password":"admin123"}'
```

Open **http://localhost:3000** → login with `admin@crm.local` / `admin123`.

### Operational notes

- **API calls fail in browser (404 / refused):** the browser only talks to its own
  origin. Check the frontend rewrite works (`docker compose logs frontend`), confirm
  `api` is up (`docker compose ps api`), and that `API_URL=http://api:4000` is set.
  Restart frontend if it started before the API: `docker compose restart frontend`.
- **Notification service down still works:** the API calls it **fire-and-forget**.
  API stays green; notifications lag until the service returns. This is intended.
- **Port conflict (5432 etc.):** remap the host port, e.g. `"5433:5432"`, and update
  `DATABASE_URL` accordingly.

---

## 10. Public Images You Can Use Directly (no local build)

The images are published to Docker Hub and can be pulled instead of building
locally. Replace the build step in §7 with a pull, or point the Compose images at
them directly.

Author images (update the namespace to match the actual publish account, e.g.
`mohussam865/...`):

```bash
docker pull mohussam865/frontend
docker pull mohussam865/api
docker pull mohussam865/notification-service
```

> Tagging is up to you for production (e.g. `mohussam865/api:1.0.0`). Use an
> immutable, versioned tag — not `latest` — so deploys are reproducible and
> rollbacks are trivial.

---

## 11. Production Checklist (how to take this to prod)

- [ ] **Pin image tags/digests** (no floating `latest`, no floating `node:20` /
      `postgres:16`).
- [ ] **Secrets:** move `POSTGRES_PASSWORD`, `JWT_SECRET`, admin credentials into a
      secrets manager / Docker secrets / Kubernetes secrets. No plaintext in YAML.
- [ ] **Non-root everywhere** (already true) and `runAsNonRoot: true` under
      Kubernetes.
- [ ] **Ingress/TLS** in front of the frontend (this is why the architecture starts
      with an Ingress in README).
- [ ] **Persistence:** keep `postgres` data on a durable volume / PVC.
- [ ] **Health checks** in Kubernetes use the same `/health` endpoints the
      Containerfile relies on (`/api/health`, `/health`).
- [ ] **Observability:** log shipping, metrics, restart policies, resource
      limits/requests per service.
- [ ] **CI/CD (future):** the README deliberately leaves CI/CD out of scope — add it
      later as a separate enhancement (build → push to Docker Hub → deploy).

---

## Quick Reference Card

```bash
# Build all
docker build -t frontend ./frontend
docker build -t api ./api-service
docker build -t notification-service ./notification-service

# OR use prebuilt public images
docker compose pull                 # after pointing image: at published names

# Run the stack
docker compose up -d
docker compose ps
docker compose logs -f

# Stop / reset
docker compose down
docker compose down -v              # destroys postgres_data volume

# Rebuild & restart
docker compose up -d --build

# Access
# Frontend:  http://localhost:3000     (login: admin@crm.local / admin123)
# API:       http://localhost:4000
# Notif:     http://localhost:5000/health
# DB:        localhost:5432
```