# Very important: this file descript the full app architecture while this folder / project only focuses on the front-end part only 

# Project Goal

The goal is NOT to build the next Salesforce.

The goal is to demonstrate:

- Microservices architecture
- Docker
- Kubernetes
- Terraform
- Ansible
- Monitoring
- Clean project organization
- API communication
- Production-like deployment

The CRM itself should stay intentionally simple.

Repository Structure

```
microcrm/
├── frontend/                  # Next.js (UI)
├── api/                       # Next.js API service
├── notification-service/      # Node.js service
│
├── docs/
│
├── docker-compose.yml
│
└── README.md
```

```
Architecture
                    Internet
                        │
                    Ingress
                        │
                Frontend (Next.js)
                        │
                  REST API Calls
                        │
                API Service (Next.js)
                ├──────────────┐
                │              │
                ▼              ▼
          PostgreSQL     Notification Service
```

Services

1. Frontend

Responsible only for UI.

No database access.

Communicates only with API.

Features

- Login
- Dashboard
- Customers
- Companies
- Tasks
- Notifications
- Profile

2. API

Handles business logic.

Responsible for

Authentication

CRUD

Validation

Database

Calling Notification Service

3. Notification Service

Extremely small service.

Receives

POST /notify

Stores notifications.

Provides

GET /notifications

- No Firebase.
- No Email.
- No Push Notifications.

Database

## Single PostgreSQL instance.

### Tables

- users
- companies
- customers
- tasks
- notifications

That's enough.

CRM Features

Authentication

Simple JWT login.

Admin user seeded.

Dashboard

Shows

- Total Customers
- Total Companies
- Open Tasks
- Completed Tasks

Latest Notifications

### Companies

CRUD

Fields

id

name

industry

phone

website

created_at

### Customers

CRUD

Fields

id

company_id

name

email

phone

position

status

created_at

Status

### Lead

Customer

Inactive

### Tasks

CRUD

Assigned to customer.

Fields

title

description

priority

status

due_date

Priority
```
Low

Medium

High
```

Status

```
Todo

In Progress

Done
```

### Notifications

Created automatically when

Customer created

Company created

Task assigned

Task completed

Notification Service stores

- title
- message
- created_at

API Endpoints

Authentication

```
POST /login

GET /me
```

Companies

```
GET /companies

POST /companies

PUT /companies/:id

DELETE /companies/:id
```

Customers

```
GET /customers

POST /customers

PUT /customers/:id

DELETE /customers/:id
```

Tasks

```
GET /tasks

POST /tasks

PUT /tasks/:id

DELETE /tasks/:id
```

Notifications

```
GET /notifications
```

## Docker

Each service has

- Dockerfile
- Multi-stage builds.

### Images

- frontend
- api
- notification-service

### Docker Compose

Runs

- Frontend
- API
- Notification Service
- PostgreSQL

One command

```bash
docker compose up
```

### Docker Hub

Each service pushed separately.

- yourname/frontend
- yourname/api
- yourname/notification-service


## Phase Plan

### Phase 1

- Repository structure
- PostgreSQL

### Phase 2

- Frontend
- Authentication
- Layout

### Phase 3

- API
- JWT
- CRUD
- Database

### Phase 4

- Notification Service
- HTTP communication

### Phase 5

- Docker
- Dockerfiles
- Compose
- Docker Hub

> To keep the project focused, the following features are intentionally out of scope:

- Multi-tenant organizations
- Email sending
- SMS integrations
- OAuth (Google, GitHub, Microsoft)
- WebSockets
- RabbitMQ/Kafka
- Redis
- File uploads
- Payment processing
- Complex reporting
- Advanced permissions (RBAC beyond a simple admin/user model)
- CI/CD pipelines (these can be added later as a separate enhancement)

Project Ports Design

Local Development Ports

- Service	Technology	Container Port	Local Port	Purpose
- Frontend	Next.js	3000	3000	User interface
- API Service	Next.js API	4000	4000	Main backend
- Notification Service	Node.js	5000	5000	Internal notifications
- PostgreSQL	PostgreSQL	5432	5432	Database