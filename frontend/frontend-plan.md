# Frontend Plan â€” CRM Microservices

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
â”œâ”€â”€ frontend/                  # THIS PROJECT â€” Next.js UI
â”œâ”€â”€ api-service/               # Next.js API (business logic, auth, CRUD, DB)
â”œâ”€â”€ notification-service/      # Node.js (receive/store notifications)
â”œâ”€â”€ docs/
â”œâ”€â”€ docker-compose.yml
â””â”€â”€ README.md
```

### 1.3 Architecture & Data Flow

```
Internet â†’ Ingress â†’ Frontend (Next.js, port 3000)
                          â”‚
                    REST API calls
                          â”‚
                   API Service (Next.js, port 4000)
                     â”œâ”€â”€ PostgreSQL (port 5432)
                     â””â”€â”€ Notification Service (Node.js, port 5000)
```

### 1.4 Frontend Boundaries (CRITICAL)

**The frontend MUST:**
- Handle UI only (pages, components, user interaction)
- Communicate exclusively with the API Service via HTTP REST
- Use Next.js Rewrites to proxy /api/* to the backend (avoid browser-side DNS issues)

**The frontend MUST NOT:**
- Access the database directly
- Contain backend/business logic
- Store secrets or passwords
- Call the Notification Service directly

### 1.5 Environment Variables

| Variable | Dev Value | Docker/K8s Value | Purpose |
|---|---|---|---|
| `API_URL` (server-side, not public) | not set (defaults to `http://api:4000`) | `http://api:4000` (Docker) / `http://api-service:4000` (K8s) | Backend URL for Next.js Rewrite proxy |

### 1.6 Rules from instructions.md

- Keep it simple â€” no unnecessary complexity or dependencies
- Never hardcode URLs, passwords, or secrets
- Use TypeScript with strong typing
- Small functions, clear naming, separation of concerns
- Code must be clean, readable, maintainable, production-oriented
- Before finishing: verify builds pass, lint passes, existing functionality is not broken
- When adding features: explain what files change, why, and architectural impact

### 1.7 Cross-Reference with API Service

This plan is aligned with `api-plan.md`. Key integration points:
- All API calls use relative /api/* paths; Next.js Rewrites proxy them to the API service on port 4000
- **The API service uses `/api` prefix on all routes** â€” e.g. `POST /api/login`, `GET /api/companies`
- Both services agree on: JWT auth, `{ success, data }` response format, and database schema
- Notification flow: Frontend â†’ API Service â†’ Notification Service (frontend never calls notification service directly)
---

## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 â€” Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly (TypeScript + ESLint)
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` â€” all pages use async-only setState with cancelled flags
---
## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 â€” Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` â€” all pages use async-only setState with cancelled flags
---
---


## 2. Current State
## 2. Current State
## 2. Current State
## 2. Current State

- **Completed:** Phases 1 (Foundation), 2 (Authentication), 3 (Layout & Navigation), 4 (Feature Pages)
- **Next:** Phase 5 â€” Docker (Dockerfile, .dockerignore, next.config.ts standalone output)
- All 6 feature pages implemented with full CRUD: Dashboard, Companies, Customers, Tasks, Notifications, Profile
- Shared Modal component for add/edit forms
- Lint and build passing cleanly
- Dependencies unchanged: `next`, `react`, `react-dom` only
- ESLint strict rule `react-hooks/set-state-in-effect` â€” all pages use async-only setState with cancelled flags

- Fresh Next.js 16 project created via `create-next-app`
- TypeScript, Tailwind CSS v4, ESLint, App Router
- Dependencies: `next`, `react`, `react-dom` only
- Boilerplate `app/page.tsx`, `app/layout.tsx`, `app/globals.css` present
- No custom code yet â€” clean slate
---

## 3. Plan Phases (Minimal Working Frontend)

### Phase 1 â€” Foundation

**Goal:** Set up the project skeleton, types, and API communication layer.

**Tasks:**

1. **`next.config.ts`** â€” Create with `NEXT_PUBLIC_API_URL=http://localhost:4000`
2. **`src/types/`** â€” TypeScript interfaces matching API responses:
   - `User` (id, email, name)
   - `Company` (id, name, industry, phone, website, created_at)
   - `Customer` (id, company_id, name, email, phone, position, status, created_at)
   - `Task` (id, title, description, priority, status, due_date, customer_id, created_at)
   - `Notification` (id, title, message, created_at)
   - `ApiResponse<T>` wrapper: `{ success: boolean; data?: T; message?: string }`
3. **`src/lib/api.ts`** â€” Fetch wrapper:
   - `apiClient(baseUrl)` factory function
   - Methods: `get`, `post`, `put`, `delete`
   - Automatic JSON parsing, error handling
   - Uses empty base URL (relative path); Next.js Rewrites handle proxying
   - Attaches JWT token from localStorage (if present)
4. **Verify:** `npm run build` passes

**Files created:**
```
frontend/
â”œâ”€â”€ next.config.ts
â””â”€â”€ src/
    â”œâ”€â”€ types/
    â”‚   â””â”€â”€ index.ts
    â””â”€â”€ lib/
        â””â”€â”€ api.ts
```

---

### Phase 2 â€” Authentication

**Goal:** Login page + auth state management + protected routes.

**Tasks:**

1. **`src/contexts/AuthContext.tsx`** â€” React context with `user`, `token`, `login()`, `logout()`
   - `login()` calls `POST /api/login` on the API service
2. **`src/components/AuthGuard.tsx`** â€” Client wrapper; redirects to `/login` if not authenticated
3. **`app/login/page.tsx`** â€” Email + password form, calls `login()`, redirects to `/dashboard`
4. **`app/(protected)/layout.tsx`** â€” Wraps children with `AuthGuard` + Sidebar navigation

**Files created:**
```
src/contexts/AuthContext.tsx
src/components/AuthGuard.tsx
app/login/page.tsx
app/(protected)/layout.tsx
```

---

### Phase 3 â€” Layout & Navigation âœ“

**Goal:** Shared app shell with sidebar and consistent look.

**Status:** âœ… COMPLETED

**Tasks:**
1. **`src/components/Sidebar.tsx`** â€” Extracted sidebar component with nav links
2. **`app/(protected)/layout.tsx`** â€” Sidebar layout: Dashboard, Companies, Customers, Tasks, Notifications, Profile, Logout
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
### Phase 3 â€” Layout & Navigation
### Phase 4 â€” Feature Pages (CRUD + Dashboard) âœ“

**Goal:** Functional pages that call the API and display real data.

**Status:** âœ… COMPLETED

1. **Dashboard** â€” Stat cards (Total Customers, Companies, Open Tasks, Completed Tasks) + Latest 5 Notifications
2. **Companies** â€” Table + Add/Edit/Delete modal
3. **Customers** â€” Table + Add/Edit/Delete, status badges (Lead / Customer / Inactive)
4. **Tasks** â€” Table + Add/Edit/Delete, priority badges (Low/Medium/High), status badges (Todo/In Progress/Done)
5. **Notifications** â€” Read-only list of title, message, created_at
6. **Profile** â€” Display current user info (name, email)

**API Paths:** All endpoints use `/api` prefix as defined by the API service:
`POST /api/login`, `GET /api/me`, `GET/POST /api/companies`, `PUT/DELETE /api/companies/:id` (same pattern for customers, tasks). `GET /api/notifications`.

**Files created:**
```
src/components/Modal.tsx
```

**Files updated:**
```
app/(protected)/dashboard/page.tsx    â€” stat cards + notifications
app/(protected)/companies/page.tsx    â€” full CRUD table + modal form
app/(protected)/customers/page.tsx    â€” full CRUD table + modal form + status badges
app/(protected)/tasks/page.tsx         â€” full CRUD table + modal form + priority/status badges
app/(protected)/notifications/page.tsx â€” read-only list from API
app/(protected)/profile/page.tsx       â€” user info from AuthContext
```

---

**Goal:** Shared app shell with sidebar and consistent look.

**Tasks:**

1. **`src/components/Sidebar.tsx`** â€” Extracted sidebar component with nav links
2. **`app/(protected)/layout.tsx`** â€” Sidebar layout: Dashboard, Companies, Customers, Tasks, Notifications, Profile, Logout
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

### Phase 4 â€” Feature Pages (CRUD + Dashboard)

**Goal:** Functional pages that call the API and display real data.

1. **Dashboard** â€” Stat cards (Total Customers, Companies, Open Tasks, Completed Tasks) + Latest 5 Notifications
2. **Companies** â€” Table + Add/Edit/Delete modal
3. **Customers** â€” Table + Add/Edit/Delete, status badges (Lead / Customer / Inactive)
4. **Tasks** â€” Table + Add/Edit/Delete, priority badges (Low/Medium/High), status badges (Todo/In Progress/Done)
5. **Notifications** â€” Read-only list of title, message, created_at
6. **Profile** â€” Display current user info (name, email)

**API Paths:** All endpoints use `/api` prefix as defined by the API service:
`POST /api/login`, `GET /api/me`, `GET/POST /api/companies`, `PUT/DELETE /api/companies/:id` (same pattern for customers, tasks). `GET /api/notifications`.

---

### Phase 5 â€” Docker

**Goal:** Containerize the frontend.

1. **`Dockerfile`** â€” Multi-stage (node:22-alpine, standalone output, non-root)
2. **`.dockerignore`** â€” node_modules, .next, .env, .git
3. **`next.config.ts`** â€” Add `output: "standalone"`
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
| API proxy | Next.js Rewrites proxy /api/* to backend | Straightforward client-server pattern |

---

## 5. File Structure (Target)

```
frontend/
â”œâ”€â”€ next.config.ts                        # async rewrites() proxies /api/*
â”œâ”€â”€ .dockerignore
â”œâ”€â”€ Dockerfile
â”œâ”€â”€ next.config.ts                      # output: "standalone"
â”œâ”€â”€ package.json
â”œâ”€â”€ tsconfig.json
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ types/
â”‚   â”‚   â””â”€â”€ index.ts                    # All TypeScript interfaces
â”‚   â”œâ”€â”€ lib/
â”‚   â”‚   â””â”€â”€ api.ts                      # Fetch wrapper (apiClient)
â”‚   â”œâ”€â”€ contexts/
â”‚   â”‚   â””â”€â”€ AuthContext.tsx             # Auth state provider
â”‚   â””â”€â”€ components/
â”‚       â”œâ”€â”€ AuthGuard.tsx               # Protected route wrapper
â”‚       â””â”€â”€ Sidebar.tsx                 # Navigation sidebar
â””â”€â”€ app/
    â”œâ”€â”€ globals.css
    â”œâ”€â”€ layout.tsx                      # Root layout + AuthProvider
    â”œâ”€â”€ page.tsx                        # Redirect to /dashboard or /login
    â”œâ”€â”€ login/
    â”‚   â””â”€â”€ page.tsx                    # Login form
    â””â”€â”€ (protected)/
        â”œâ”€â”€ layout.tsx                  # Protected layout with Sidebar
        â”œâ”€â”€ dashboard/
        â”‚   â””â”€â”€ page.tsx                # Stats + latest notifications
        â”œâ”€â”€ companies/
        â”‚   â””â”€â”€ page.tsx                # Companies CRUD table
        â”œâ”€â”€ customers/
        â”‚   â””â”€â”€ page.tsx                # Customers CRUD table
        â”œâ”€â”€ tasks/
        â”‚   â””â”€â”€ page.tsx                # Tasks CRUD table
        â”œâ”€â”€ notifications/
        â”‚   â””â”€â”€ page.tsx                # Notifications list (read-only)
        â””â”€â”€ profile/
            â””â”€â”€ page.tsx                # User profile
```

---

## 6. API Contract (What the Frontend Expects from API Service)

### Authentication
```
POST /api/login          { email, password }  â†’  { success, data: { token, user } }
GET  /api/me             Authorization: Bearer <token>  â†’  { success, data: { user } }
```

### Companies
```
GET    /api/companies           â†’  { success, data: Company[] }
POST   /api/companies           â†’  { success, data: Company }
PUT    /api/companies/:id       â†’  { success, data: Company }
DELETE /api/companies/:id       â†’  { success, message }
```

### Customers
```
GET    /api/customers           â†’  { success, data: Customer[] }
POST   /api/customers           â†’  { success, data: Customer }
PUT    /api/customers/:id       â†’  { success, data: Customer }
DELETE /api/customers/:id       â†’  { success, message }
```

### Tasks
```
GET    /api/tasks               â†’  { success, data: Task[] }
POST   /api/tasks               â†’  { success, data: Task }
PUT    /api/tasks/:id           â†’  { success, data: Task }
DELETE /api/tasks/:id           â†’  { success, message }
```

### Notifications
```
GET    /api/notifications       â†’  { success, data: Notification[] }
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

