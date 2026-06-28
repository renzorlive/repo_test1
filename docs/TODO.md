# RNZ OS — Remaining TODO

The foundation is intentionally scoped. This is the backlog of what is **not**
yet built, grouped by area. Items are roughly ordered by priority within each
group.

## 🔐 Auth & access control

- [ ] OAuth providers (GitHub, Google) alongside credentials.
- [ ] Email verification + password reset flows.
- [ ] Role-based authorization checks in services (currently only membership is
      enforced; `OWNER`/`ADMIN`/`MEMBER`/`VIEWER` are not yet differentiated).
- [ ] Workspace invitations (token-based) + accept flow.
- [ ] Rate limiting on auth + mutation endpoints.

## 🏢 Workspace & navigation

- [ ] Wire `WorkspaceSwitcher` to the real `/api/workspaces` endpoint and
      persist the active workspace (cookie or URL segment).
- [ ] Active-workspace context provider consumed by hooks/pages.
- [ ] Mobile sidebar sheet (drawer) for `< lg` breakpoints.
- [ ] `⌘K` command palette (cmdk dependency already installed).

## 📊 Data wiring (replace mock data)

- [ ] Swap each page from `lib/mock-data.ts` to its React Query hook.
- [ ] Project detail view (board + list) for missions/epics/tasks.
- [ ] Mission detail view with epic/task breakdown and progress rollup.
- [ ] Task CRUD + drag-and-drop Kanban (status columns).
- [ ] Epic, Decision and Artifact API routes + services + repositories.
- [ ] Optimistic updates + toasts on mutations.

## 🤖 AI agents (no AI in foundation by design)

- [ ] Agent run history + logs models.
- [ ] Workflow builder UI (node/edge editor over `Workflow.definition`).
- [ ] Activate BullMQ: workers under `server/workers/`, enqueue from services.
- [ ] Provider-agnostic agent execution interface (deferred — no AI yet).

## 🎨 UI / UX

- [ ] Toast/notification system (e.g. sonner).
- [ ] Loading skeletons per page + React Query suspense boundaries.
- [ ] Empty states for every list.
- [ ] Form dialogs for create/edit (project, mission, agent).
- [ ] Accessibility audit (focus traps, ARIA, keyboard nav).

## 🧱 Platform & quality

- [ ] Create the first Prisma migration (`prisma migrate dev`) — schema is
      defined but no migration is committed yet.
- [ ] Testing: Vitest (unit: services/repositories) + Playwright (e2e).
- [ ] CI pipeline: typecheck, lint, test, build, prisma validate.
- [ ] Structured logging + error reporting (e.g. pino + Sentry).
- [ ] Seed expansion (more projects/missions/tasks/agents).
- [ ] Dockerfile + docker-compose (Postgres + Redis) for local dev.
- [ ] Turborepo extraction if/when a second app is added.
```
