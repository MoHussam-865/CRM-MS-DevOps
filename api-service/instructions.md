Docker Compose Network
Inside Docker, services communicate using service names, not localhost.

Example:
frontend
   |
   |
   api:4000
   |
   |
notification-service:5000
   |
   |
postgres:5432

So the API URL inside frontend:
NEXT_PUBLIC_API_URL=http://localhost:4000

But inside Kubernetes:
NEXT_PUBLIC_API_URL=http://api-service:4000

Kubernetes Service Names
Your Kubernetes services:
frontend-service

api-service

notification-service

postgres-service

Internal communication:

API → Notification
http://notification-service:5000/notify

API → Database
postgres-service:5432

Environment Variables
Never hardcode URLs.

Example:
frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:4000

api/.env
PORT=4000

DATABASE_URL=postgresql://user:password@postgres:5432/crm

NOTIFICATION_SERVICE_URL=http://notification-service:5000

notification-service/.env
PORT=5000

DATABASE_URL=postgresql://user:password@postgres:5432/crm

Docker Compose Example
services:

  frontend:
    build:
      context: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - api


  api:
    build:
      context: ./api
    ports:
      - "4000:4000"
    depends_on:
      - postgres
      - notification-service


  notification-service:
    build:
      context: ./notification-service
    ports:
      - "5000:5000"
    depends_on:
      - postgres


  postgres:
    image: postgres:16
    ports:
      - "5432:5432"

AI_AGENT_INSTRUCTIONS.md
Create this file in the root:
microcrm/
│
├── AI_AGENT_INSTRUCTIONS.md

Content:
# AI Agent Development Instructions

## Project Overview

This project is a production-style CRM microservices application.

The goal is to demonstrate:

- Microservices architecture
- Docker containerization
- Kubernetes deployment
- Infrastructure automation
- Monitoring

The application should remain simple.
Do not add unnecessary complexity.

---

# General Rules

## Always follow best practices

Before writing code:

1. Understand the existing architecture.
2. Check existing patterns.
3. Reuse existing components.
4. Avoid unnecessary dependencies.

Do not introduce new technologies unless required.

---

# Code Quality

All code must be:

- Clean
- Readable
- Maintainable
- Production-oriented

Avoid:

- Duplicate code
- Large files
- Magic numbers
- Hardcoded values


Prefer:

- Small functions
- Clear naming
- Separation of concerns
- Type safety

---

# Architecture Rules

The project contains independent services:

## Frontend

Location:


frontend/

Technology:

- Next.js
- TypeScript
- Tailwind


Responsibilities:

- UI only
- User interaction
- API communication


The frontend must NOT:

- Access database directly
- Contain backend logic
- Store secrets

---

## API Service

Location:


api/

Responsibilities:

- Business logic
- Authentication
- Validation
- Database operations


Must follow:

Controller → Service → Repository pattern


Example:


controllers/

services/

repositories/

models/

Controllers should not contain business logic.

---

## Notification Service

Location:


notification-service/


Responsibilities:

- Receive notification requests
- Store notifications


Keep this service independent.

---

# Environment Variables

Never hardcode:

- URLs
- passwords
- secrets
- database connections


Always use:

.env files


Example:

GOOD:


process.env.DATABASE_URL


BAD:


postgres://admin:password@localhost

---

# Docker Rules

Every service must have:

- Dockerfile
- .dockerignore


Docker images should:

- Use multi-stage builds
- Run as non-root when possible
- Keep images small


Never install unnecessary packages.

---

# Kubernetes Rules

Every deployment must include:

- Deployment
- Service
- ConfigMap if needed
- Secret if needed


Every container should have:

- readinessProbe
- livenessProbe


Always define:

- resource requests
- resource limits


Example:


resources:
requests:
cpu: 100m
memory: 128Mi

---

# Database Rules

Use migrations.

Never manually modify production databases.

Database changes require:

- migration file
- schema update
- documentation

---

# API Rules

All APIs must:

- Validate input
- Return consistent responses
- Handle errors properly


Example:

Success:

```json
{
 "success": true,
 "data": {}
}

Error:
{
 "success": false,
 "message": "Invalid request"
}
```

Security Rules
Never commit:
- .env files
- passwords
- API keys
- secrets
Use:
- Kubernetes Secrets
- Environment variables
Git Rules
Commits should be meaningful.

Examples:

GOOD:
add customer CRUD endpoint

BAD:
changes

Before Finishing Any Task
The AI agent must verify:
1. Code compiles.
2. Tests pass.
3. Docker build works.
4. Existing functionality is not broken.
5. Documentation is updated if needed.
When Adding New Features
The AI agent must explain:
1. What files will change.
2. Why the change is needed.
3. Any architectural impact.
Do not make large changes without explanation.
Preferred Patterns
Use:
- Dependency injection
- Repository pattern
- Service layer
- DTO validation
- Strong typing
- Clean folder structure
Avoid:
- God classes
- Huge components
- Business logic inside UI
- Tight coupling between services
Important
This project is a learning and portfolio project.

Prefer realistic production practices while keeping implementation simple.

---

This gives your AI agent a **project constitution**. Every future AI session starts by reading this file, so it won't randomly introduce Firebase, Redis, Kafka, or rewrite your architecture.

A good next step after this would be creating the actual **monorepo initialization plan**:
- create Next.js frontend
- create API service
- create notification service
- create Dockerfiles
- create first docker-compose.yml

before touching Kubernetes.