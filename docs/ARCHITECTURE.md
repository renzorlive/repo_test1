# RNZ OS — Architecture

> An AI Operating System for founders, agencies and AI-assisted software
> development. RNZ OS is an **execution platform** that orchestrates projects,
> missions, AI agents and knowledge — not a task manager and not a chat app.

This document describes the foundation: the architecture, the layering rules
and the conventions every contributor should follow.

---

## 1. Tech stack

| Concern          | Choice                                  |
| ---------------- | --------------------------------------- |
| Framework        | Next.js 15 (App Router, RSC)            |
| Language         | TypeScript (strict)                     |
| Styling          | TailwindCSS + shadcn/ui (new-york)      |
| Animation        | Framer Motion                           |
| Database         | PostgreSQL                              |
| ORM              | Prisma 6                                |
| Auth             | Auth.js (NextAuth v5) + Prisma adapter  |
| Data fetching    | TanStack React Query v5                 |
| Validation       | Zod                                     |
| Background jobs  | BullMQ + ioredis (**prepared only**)    |
| Forms            | react-hook-form + @hookform/resolvers   |

---

## 2. Layered architecture

RNZ OS uses a strict, one-directional dependency flow. Each layer may only
depend on the layers **below** it. This keeps business logic testable and
independent of HTTP and React.

```
┌──────────────────────────────────────────────────────────┐
│  UI layer            app/**, components/**, hooks/**        │  React / RSC
├──────────────────────────────────────────────────────────┤
│  API layer           app/api/**  (route handlers)          │  HTTP boundary
│  Controller layer    server/controllers/**                 │  parse + map
│                      + server/http.ts                      │  HTTP↔service
├──────────────────────────────────────────────────────────┤
│  Service layer       server/services/**                    │  Business rules
│                      + server/policies/**  (authz)         │  + orchestration
│                      + server/events/**    (activity)      │  + access control
├──────────────────────────────────────────────────────────┤
│  Repository layer    server/repositories/**                │  Data access only
├──────────────────────────────────────────────────────────┤
│  Data layer          prisma/**  +  lib/prisma.ts           │  Persistence
└──────────────────────────────────────────────────────────┘

Cross-cutting: lib/** (env, utils, auth, queue), validations/** (Zod),
               types/**, config/**

Server Components read through the **service layer** directly (the idiomatic
Next.js path); Client Components fetch the **API layer** via React Query / the
typed `apiClient`. Both paths converge on services — never on repositories.
```

### Layer responsibilities

- **Repositories** (`server/repositories`) — the _only_ code that imports
  Prisma directly. Thin, no business rules. One repository per aggregate.
- **Services** (`server/services`) — business logic + authorization. Every
  service method validates workspace membership through
  `services/access.ts` before touching a repository. Services throw typed
  domain errors (`server/errors.ts`).
- **API routes** (`app/api`) — translate HTTP ↔ services. They parse input
  with Zod, call a service, and wrap the result via `server/http.ts`
  (`ok`, `route`, `handleError`). No business logic lives here.
- **UI** (`app`, `components`, `hooks`) — Server Components by default;
  Client Components (`"use client"`) only where interactivity is needed.
  Data is fetched through React Query hooks that call the typed `apiClient`.

### Golden rules

1. A React component never imports a repository or Prisma.
2. An API route never imports Prisma; it goes through a service.
3. A service never returns a `Response`; it returns data or throws.
4. All external input is validated by a Zod schema from `validations/`.

---

## 3. Multi-tenancy & authorization

Every domain entity is scoped to a **Workspace**. Users join workspaces via
**Membership**, which carries a `Role` (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`).

- `requireUser()` resolves the authenticated user from the Auth.js session.
- `requireMembership(workspaceId)` ensures the user belongs to the workspace
  and returns the membership (so services can do role checks later).
- Resource ownership is double-checked: e.g. `projectService.getById`
  verifies `project.workspaceId === workspaceId` before returning, preventing
  cross-tenant ID guessing.

Authentication uses a JWT session strategy (required for the Credentials
provider). The edge-safe `auth.config.ts` powers `middleware.ts`, which gates
every non-public route; the Node-only `auth.ts` adds Prisma + bcrypt.

---

## 4. Domain model

The execution hierarchy and the AI layer:

```
Workspace ──< Membership >── User
    │
    ├──< Project ──< Mission ──< Epic ──< Task >── (Assignee: User | Agent)
    │        │                              │
    │        ├──< Decision                  └──< Artifact
    │        └──< Artifact
    │
    ├──< Agent ──< Workflow
    └──< Workflow
```

- **Project** — a container of work with a unique `key` per workspace (e.g. `RNZ`).
- **Mission** — a high-level objective; rolls up progress from its epics/tasks.
- **Epic** — a body of work grouping related tasks under a mission.
- **Task** — the atomic unit; assignable to a human (`User`) _or_ an `Agent`.
- **Agent** — an AI agent _definition_ (type, instructions, config). No live
  AI execution yet — `config`/`instructions` are stored only.
- **Workflow** — a declarative step graph (`definition` JSON) for orchestration.
- **Decision** — a decision log (ADR-style) attached to a project.
- **Artifact** — an output (document, code, design, dataset…) of a project/task.

See `prisma/schema.prisma` for the full schema, indexes and cascade rules.

---

## 4a. The Mission Engine (central domain)

The **Mission** is the source of truth for execution. Every execution entity
hangs off a mission, and every meaningful change becomes an immutable activity
row. This is the platform's core, not CRUD.

### Mission-owned entities

```
Mission
├── MissionContext      1:1  working brief (background, constraints, refs)
├── MissionTimeline     1:N  planned milestones / phases
├── Epic → Task         1:N  execution breakdown (progress rollup source)
├── Decision            1:N  decision log
├── Artifact            1:N  produced outputs
├── MissionApproval     1:N  human approval gates
├── MissionMetric       1:N  time-series metric samples
├── MissionNote         1:N  collaboration notes
├── MissionDependency   1:N  directed mission→mission edges
├── AiSession           1:N  AI working sessions (token + cost accounting)
├── MissionExecution    1:N  orchestration runs (future BullMQ unit)
└── MissionActivity     1:N  append-only timeline (every important event)
```

Mission carries the execution envelope directly: `objective`, `outcome`,
`status`, `health`, `progress`, `owner`, `startedAt`/`completedAt`/`dueDate`,
`estimatedHours`/`actualHours`, `estimatedCost`/`actualCost`. `workspaceId` is
**denormalized** from the parent project so workspace dashboards are single
indexed reads (`@@index([workspaceId, status])`) rather than joins — a
deliberate choice for scaling to thousands of missions and millions of events.

### Status vs. health

Two orthogonal axes: **status** is the lifecycle (`DRAFT → ACTIVE → COMPLETED`…)
and **health** is the operational signal (`ON_TRACK`, `AT_RISK`, `OFF_TRACK`,
`BLOCKED`). `MissionService.deriveHealth()` is a pure function of status,
progress and deadline; `recompute()` rolls progress up from the task counts.

### Events & the activity timeline

Services never insert activity directly. They call **`missionEvents.emit()`**
(`server/events/mission-events.ts`), the single chokepoint that:

1. persists a durable `MissionActivity` row, and
2. fans out to in-process subscribers.

The subscriber seam is where a future SSE/WebSocket bridge or BullMQ publisher
attaches for **live timelines** — no service code changes required. Every state
transition (created, status/health changed, completed, approval requested/
decided, AI session started/completed/failed, note/metric/dependency added)
flows through it, which is why the timeline is complete by construction.

### Authorization — MissionPolicies

`server/policies/mission.policy.ts` holds pure, role-ranked capability checks
(`view < contribute/edit < approve/manage`). The shared guard
`requireMissionAccess(workspaceId, missionId, capability)` combines tenancy,
cross-tenant ownership verification, and the capability check in one call used
by every mission-scoped service — so authorization is never re-implemented.

### Request flow (example: decide an approval)

```
PATCH /api/.../missions/:id/approvals/:approvalId
  → route handler (thin)               app/api/**
  → missionController.decideApproval    parse zod, map HTTP
  → missionApprovalService.decide       requireMissionAccess("approve")
  → missionApprovalRepository.update     Prisma
  → missionEvents.emit(APPROVAL_*)       append activity + notify
```

---

## 5. Background jobs (prepared, not active)

`lib/queue.ts` sets up a lazy BullMQ connection and a queue registry
(`agent-run`, `workflow-execution`, `artifact-generation`). No workers run and
no jobs are enqueued yet. Activating requires `REDIS_URL`, workers under
`server/workers/`, and `getQueue(name).add(...)` calls from the service layer.

---

## 6. Design system

- HSL CSS variables in `globals.css` drive both themes; `next-themes` toggles
  the `.dark` class. Tailwind tokens map to those variables.
- shadcn/ui primitives live in `components/ui`. Domain components compose them.
- Status/priority colors are centralized in `components/status-badge.tsx` so
  they stay consistent everywhere.
- Framer Motion is used sparingly (`components/motion/fade-in.tsx`) for polished
  section entrances.

Principles: **Apple-level polish, Linear simplicity, Notion flexibility,
GitHub developer experience.**

---

## 7. Monorepo readiness

The codebase is structured so it can be lifted into a monorepo (Turborepo/pnpm
workspaces) with minimal churn:

- Path alias `@/*` keeps imports stable if the app moves to `apps/web`.
- `server/` (repositories, services, errors) and `validations/` are
  framework-agnostic and could be extracted into `packages/core`.
- `prisma/` could become `packages/db`.
- `components/ui` could become `packages/ui`.

No package currently reaches across a boundary it shouldn't, so extraction is a
move-and-reexport exercise rather than a refactor.
