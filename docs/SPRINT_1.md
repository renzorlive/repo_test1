# RNZ OS — Sprint 1 implementation plan

**Goal of Sprint 1:** turn the foundation into a _functional vertical slice_ —
a signed-in user can create real projects, missions and tasks in a real
workspace, backed by Postgres, replacing all mock data on the core screens.

**Duration:** 2 weeks · **Theme:** "From scaffold to working product."

---

## Sprint outcomes (Definition of Done)

1. A migration exists and the database can be provisioned from scratch.
2. Sign up → land in a real, persisted workspace → see live data.
3. Projects, Missions and Tasks are fully CRUD-backed (no mock data on those
   screens).
4. The active workspace is resolved from context, not hardcoded.
5. CI runs typecheck + lint + build on every push.

---

## Workstreams

### 1. Database foundation (Day 1–2)

- [ ] Stand up Postgres + Redis via `docker-compose`.
- [ ] `prisma migrate dev --name init` → commit the first migration.
- [ ] Expand `seed.ts` with 3 projects, ~8 missions, ~20 tasks, 4 agents.
- [ ] Add a `db:reset` script (`migrate reset` + seed).

### 2. Active-workspace context (Day 2–3)

- [ ] `GET /api/workspaces` consumed in the shell; store active workspace id.
- [ ] `WorkspaceProvider` (React context) + `useActiveWorkspace()` hook.
- [ ] Wire `WorkspaceSwitcher` to switch + persist (cookie).
- [ ] Pass `workspaceId` into all data hooks.

### 3. Projects vertical slice (Day 3–5)

- [ ] Replace mock data on `/projects` with `useProjects`.
- [ ] "New project" dialog (react-hook-form + `createProjectSchema`).
- [ ] `useCreateProject` mutation with optimistic insert + toast.
- [ ] Project detail route `/projects/[projectId]` (overview + missions list).

### 4. Missions & Tasks (Day 5–8)

- [ ] Epic + Task repositories, services, validations and API routes.
- [ ] `/missions` wired to `useMissions`; create/edit dialog.
- [ ] Task Kanban on the project/mission detail (status columns).
- [ ] Drag-and-drop to change `Task.status` + `position`; persist via PATCH.
- [ ] Progress rollup: derive `Mission.progress` from task completion.

### 5. Polish & hardening (Day 8–10)

- [ ] Toasts (sonner) for all mutations; error boundaries per route.
- [ ] Loading skeletons + empty states on every list.
- [ ] Role checks in services (`OWNER`/`ADMIN` can delete; `VIEWER` read-only).
- [ ] Mobile sidebar sheet.
- [ ] CI: GitHub Actions running `typecheck`, `lint`, `build`, `prisma validate`.

---

## Explicitly out of scope for Sprint 1

- AI agent execution / LLM integration (deferred by design).
- BullMQ workers (infra is prepared; activation is a later sprint).
- Workflow builder UI.
- OAuth providers, invitations, billing.

---

## Suggested team split

| Track                         | Owner        |
| ----------------------------- | ------------ |
| DB, migrations, CI            | Platform eng |
| Workspace context + auth glue | Full-stack   |
| Projects/Missions/Tasks UI    | Frontend     |
| Services/API for Epic/Task    | Backend      |

## Key risks

- **Workspace scoping bugs** → add a service-level test asserting cross-tenant
  access is rejected before building UI on top.
- **Kanban state sync** → settle optimistic-update strategy early; standardize
  on React Query mutation patterns from `hooks/`.
- **Migration drift** → commit the migration on Day 2; never use `db push` once
  migrations exist.
