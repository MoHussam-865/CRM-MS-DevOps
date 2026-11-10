# Frontend Plan — CRM Microservices

> **Last updated:** 2026-11-10
> **This file is the single source of truth for all future AI agents (including you) working on this frontend project. Read it first before making any changes.**

---

## 1. Project Context (What We Learned)

### 1.1 Big Picture

This is a **DevOps learning project**, not a production CRM. The goal is to demonstrate:

- Microservices architecture
- Docker / Kubernetes / Terraform / Ansible
- Clean project organization & API communication
- Production-like deployment patterns

**The CRM features stay intentionally simple.** No Firebase, no Redis, no Kafka, no WebSockets, no OAuth, no emails.

### 1.2 Repository Structure

```
CRM-MS-DevOps/
├── frontend/                  # THIS PROJECT — Next.js UI
├── api-service/               # Next.js API (business logic, auth, CRUD, DB)
├── notification-service/      # Node.js (receive/store notifications)
├── docs/
├── docker-compose.yml
└── README.md
```

### 1.3 Architecture & Data Flow

```
Internet → Ingress → Frontend (Next.js, port 3000)
                          │
                    REST API calls
                          │
                   API Service (Next.js, port 4000)
                     ├── PostgreSQL (port 5432)
                     └── Notification Service (Node.js, port 5000)
```

### 1.4 Frontend Boundaries (CRITICAL)

**The frontend MUST:**
- Handle UI only (pages, components, user interaction)
- Communicate exclusively with the API Service via HTTP REST
- Use `NEXT_PUBLIC_API_URL` env var for the API base URL (never hardcoded)

**The frontend MUST NOT:**
- Access the database directly
- Contain backend/business logic
- Store secrets or passwords
- Call the Notification Service directly

### 1.5 Environment Variables

| Variable | Dev Value | Docker/K8s Value | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `http://api:4000` (Docker) / `http://api-service:4000` (K8s) | API base URL |

### 1.6 Rules from instructions.md

- Keep it simple — no unnecessary complexity or dependencies
- Never hardcode URLs, passwords, or secrets
- Use TypeScript with strong typing
- Small functions, clear naming, separation of concerns
- Code must be clean, readable, maintainable, production-oriented
- Before finishing: verify builds pass, lint passes, existing functionality is not broken
- When adding features: explain what files change, why, and architectural impact

### 1.7 Cross-Reference with API Service

This plan is aligned with `api-plan.md`. Key integration points:
- All API calls target `NEXT_PUBLIC_API_URL` which the API service exposes on port 4000
- **The API service uses `/api` prefix on all routes** — e.g. `POST /api/login`, `GET /api/companies`
- Both services agree on: JWT auth, `{ success, data }` response format, and database schema
- Notification flow: Frontend → API Service → Notification Service (frontend never calls notification service directly)
---

## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 — Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly (TypeScript + ESLint)
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` — all pages use async-only setState with cancelled flags
---
## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 — Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` — all pages use async-only setState with cancelled flags
---
---


## 2. Current State
## 2. Current State
## 2. Current State
## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 — Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` — all pages use async-only setState with cancelled flags

- Fresh Next.js 16 project created via `create-next-app`
- TypeScript, Tailwind CSS v4, ESLint, App Router
- Dependencies: `next`, `react`, `react-dom` only
- Boilerplate `app/page.tsx`, `app/layout.tsx`, `app/globals.css` present
- No custom code yet — clean slate
---

## 3. Plan Phases (Minimal Working Frontend)

### Phase 1 — Foundation

**Goal:** Set up the project skeleton, types, and API communication layer.

**Tasks:**

1. **`.env.local`** — Create with `NEXT_PUBLIC_API_URL=http://localhost:4000`
2. **`src/types/`** — TypeScript interfaces matching API responses:
   - `User` (id, email, name)
   - `Company` (id, name, industry, phone, website, created_at)
   - `Customer` (id, company_id, name, email, phone, position, status, created_at)
   - `Task` (id, title, description, priority, status, due_date, customer_id, created_at)
   - `Notification` (id, title, message, created_at)
   - `ApiResponse<T>` wrapper: `{ success: boolean; data?: T; message?: string }`
3. **`src/lib/api.ts`** — Fetch wrapper:
   - `apiClient(baseUrl)` factory function
   - Methods: `get`, `post`, `put`, `delete`
   - Automatic JSON parsing, error handling
   - Reads `NEXT_PUBLIC_API_URL` from env
   - Attaches JWT token from localStorage (if present)
4. **Verify:** `npm run build` passes

**Files created:**
```
frontend/
├── .env.local
└── src/
    ├── types/
    │   └── index.ts
    └── lib/
        └── api.ts
```

---

### Phase 2 — Authentication

**Goal:** Login page + auth state management + protected routes.

**Tasks:**

1. **`src/contexts/AuthContext.tsx`** — React context with `user`, `token`, `login()`, `logout()`
   - `login()` calls `POST /api/login` on the API service
2. **`src/components/AuthGuard.tsx`** — Client wrapper; redirects to `/login` if not authenticated
3. **`app/login/page.tsx`** — Email + password form, calls `login()`, redirects to `/dashboard`
4. **`app/(protected)/layout.tsx`** — Wraps children with `AuthGuard` + Sidebar navigation

**Files created:**
```
src/contexts/AuthContext.tsx
src/components/AuthGuard.tsx
app/login/page.tsx
app/(protected)/layout.tsx
```

---

### Phase 3 — Layout & Navigation ✓

**Goal:** Shared app shell with sidebar and consistent look.

**Status:** ✅ COMPLETED

**Tasks:**
1. **`src/components/Sidebar.tsx`** — Extracted sidebar component with nav links
2. **`app/(protected)/layout.tsx`** — Sidebar layout: Dashboard, Companies, Customers, Tasks, Notifications, Profile, Logout
3. Update root `app/layout.tsx` metadata (title: "MicroCRM")
4. Create placeholder pages for all routes

**Files created:**
```
src/components/Sidebar.tsx
app/(protected)/dashboard/page.tsx
app/(protected)/companies/page.tsx
app/(protected)/customers/page.tsx
app/(protected)/tasks/page.tsx
app/(protected)/notifications/page.tsx
app/(protected)/profile/page.tsx
```

---
### Phase 3 — Layout & Navigation
### Phase 4 — Feature Pages (CRUD + Dashboard) ✓

**Goal:** Functional pages that call the API and display real data.

**Status:** ✅ COMPLETED

1. **Dashboard** — Stat cards (Total Customers, Companies, Open Tasks, Completed Tasks) + Latest 5 Notifications
2. **Companies** — Table + Add/Edit/Delete modal
3. **Customers** — Table + Add/Edit/Delete, status badges (Lead / Customer / Inactive)
4. **Tasks** — Table + Add/Edit/Delete, priority badges (Low/Medium/High), status badges (Todo/In Progress/Done)
5. **Notifications** — Read-only list of title, message, created_at
6. **Profile** — Display current user info (name, email)

**API Paths:** All endpoints use `/api` prefix as defined by the API service:
`POST /api/login`, `GET /api/me`, `GET/POST /api/companies`, `PUT/DELETE /api/companies/:id` (same pattern for customers, tasks). `GET /api/notifications`.

**Files created:**
```
src/components/Modal.tsx
```

**Files updated:**
```
app/(protected)/dashboard/page.tsx    — stat cards + notifications
app/(protected)/companies/page.tsx    — full CRUD table + modal form
app/(protected)/customers/page.tsx    — full CRUD table + modal form + status badges
app/(protected)/tasks/page.tsx         — full CRUD table + modal form + priority/status badges
app/(protected)/notifications/page.tsx — read-only list from API
app/(protected)/profile/page.tsx       — user info from AuthContext
```

---

**Goal:** Shared app shell with sidebar and consistent look.

**Tasks:**

1. **`src/components/Sidebar.tsx`** — Extracted sidebar component with nav links
2. **`app/(protected)/layout.tsx`** — Sidebar layout: Dashboard, Companies, Customers, Tasks, Notifications, Profile, Logout
3. Update root `app/layout.tsx` metadata (title: "MicroCRM")
4. Create placeholder pages for all routes

**Files created:**
```
src/components/Sidebar.tsx
app/(protected)/dashboard/page.tsx
app/(protected)/companies/page.tsx
app/(protected)/customers/page.tsx
app/(protected)/tasks/page.tsx
app/(protected)/notifications/page.tsx
app/(protected)/profile/page.tsx
```

---

### Phase 4 — Feature Pages (CRUD + Dashboard)

**Goal:** Functional pages that call the API and display real data.

1. **Dashboard** — Stat cards (Total Customers, Companies, Open Tasks, Completed Tasks) + Latest 5 Notifications
2. **Companies** — Table + Add/Edit/Delete modal
3. **Customers** — Table + Add/Edit/Delete, status badges (Lead / Customer / Inactive)
4. **Tasks** — Table + Add/Edit/Delete, priority badges (Low/Medium/High), status badges (Todo/In Progress/Done)
5. **Notifications** — Read-only list of title, message, created_at
6. **Profile** — Display current user info (name, email)

**API Paths:** All endpoints use `/api` prefix as defined by the API service:
`POST /api/login`, `GET /api/me`, `GET/POST /api/companies`, `PUT/DELETE /api/companies/:id` (same pattern for customers, tasks). `GET /api/notifications`.

---

### Phase 5 — Docker

**Goal:** Containerize the frontend.

1. **`Dockerfile`** — Multi-stage (node:22-alpine, standalone output, non-root)
2. **`.dockerignore`** — node_modules, .next, .env, .git
3. **`next.config.ts`** — Add `output: "standalone"`
4. Verify: `docker build -t frontend .` succeeds
---

## 4. Key Design Decisions

| Decision | Choice | Reason |
|---|---|---|
| State management | React Context (no Redux/Zustand) | Project is simple; Context is sufficient |
| HTTP client | Native `fetch` wrapper | Zero extra dependencies |
| UI components | Plain Tailwind, no component library | Keeps it simple |
| Icons | Unicode/emoji or inline SVGs | No icon library dependency |
| Forms | Controlled components with `useState` | Simple forms, no extra libs |
| Routing | Next.js App Router file-system routing | Built-in, type-safe |
| Auth storage | `localStorage` for JWT | Simplest approach for MVP |
| API proxy | Direct calls to `NEXT_PUBLIC_API_URL` from client | Straightforward client-server pattern |

---

## 5. File Structure (Target)

```
frontend/
├── .env.local                          # NEXT_PUBLIC_API_URL
├── .dockerignore
├── Dockerfile
├── next.config.ts                      # output: "standalone"
├── package.json
├── tsconfig.json
├── src/
│   ├── types/
│   │   └── index.ts                    # All TypeScript interfaces
│   ├── lib/
│   │   └── api.ts                      # Fetch wrapper (apiClient)
│   ├── contexts/
│   │   └── AuthContext.tsx             # Auth state provider
│   └── components/
│       ├── AuthGuard.tsx               # Protected route wrapper
│       └── Sidebar.tsx                 # Navigation sidebar
└── app/
    ├── globals.css
    ├── layout.tsx                      # Root layout + AuthProvider
    ├── page.tsx                        # Redirect to /dashboard or /login
    ├── login/
    │   └── page.tsx                    # Login form
    └── (protected)/
        ├── layout.tsx                  # Protected layout with Sidebar
        ├── dashboard/
        │   └── page.tsx                # Stats + latest notifications
        ├── companies/
        │   └── page.tsx                # Companies CRUD table
        ├── customers/
        │   └── page.tsx                # Customers CRUD table
        ├── tasks/
        │   └── page.tsx                # Tasks CRUD table
        ├── notifications/
        │   └── page.tsx                # Notifications list (read-only)
        └── profile/
            └── page.tsx                # User profile
```

---

## 6. API Contract (What the Frontend Expects from API Service)

### Authentication
```
POST /api/login          { email, password }  →  { success, data: { token, user } }
GET  /api/me             Authorization: Bearer <token>  →  { success, data: { user } }
```

### Companies
```
GET    /api/companies           →  { success, data: Company[] }
POST   /api/companies           →  { success, data: Company }
PUT    /api/companies/:id       →  { success, data: Company }
DELETE /api/companies/:id       →  { success, message }
```

### Customers
```
GET    /api/customers           →  { success, data: Customer[] }
POST   /api/customers           →  { success, data: Customer }
PUT    /api/customers/:id       →  { success, data: Customer }
DELETE /api/customers/:id       →  { success, message }
```

### Tasks
```
GET    /api/tasks               →  { success, data: Task[] }
POST   /api/tasks               →  { success, data: Task }
PUT    /api/tasks/:id           →  { success, data: Task }
DELETE /api/tasks/:id           →  { success, message }
```

### Notifications
```
GET    /api/notifications       →  { success, data: Notification[] }
```

### Response Format (Consistent)
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "message": "Error description" }
```

---

## 7. Out of Scope (Intentionally Excluded)

- Multi-tenant organizations
- Email/SMS/Push notifications
- OAuth (Google, GitHub, Microsoft)
- WebSockets / real-time updates
- RabbitMQ / Kafka
- Redis caching
- File uploads
- Complex reporting/charts
- RBAC beyond simple admin/user
- CI/CD pipelines (added later separately)
- Dark mode toggle

---

## 8. Verification Checklist (Before Marking Phase Complete)

- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] All new files follow existing conventions
- [ ] No hardcoded URLs or secrets
- [ ] TypeScript types are used consistently
- [ ] No unnecessary dependencies added
- [ ] Code is clean, readable, and maintainable