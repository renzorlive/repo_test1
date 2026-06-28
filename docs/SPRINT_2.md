# RNZ OS — Sprint 2 proposal

**Theme:** "The Mission becomes the operating surface."

Sprint 1 shipped the foundation. This sprint made the **Mission Engine** the
central domain: an enhanced Mission model, eleven mission-owned entities, the
full service/controller/policy/event backend, the Mission Workspace UI, an
append-only activity timeline, the approval system and a live dashboard.

This document records what landed and proposes the next sprint.

---

## ✅ Delivered this sprint

- **Schema + migration** — Mission enhanced (objective, outcome, health,
  envelope of hours/cost, owner, lifecycle timestamps, denormalized
  `workspaceId`). New entities: `MissionContext`, `MissionTimeline`,
  `MissionApproval`, `MissionMetric`, `MissionNote`, `MissionDependency`,
  `MissionExecution`, `AiSession`, `MissionActivity`. Init migration generated.
- **Backend** — `MissionRepository` (+ activity/approval/note/dependency/
  metric/ai-session/dashboard repos), `MissionService` and sibling services,
  `MissionController`, `MissionValidation` (Zod), `MissionPolicies`,
  `MissionEvents`, `MissionActivity`. Strictly layered, fully typed, no `any`.
- **Frontend** — Mission Workspace with 14 command-center sections; live
  Missions list; dashboard rebuilt on real aggregates.
- **Activity timeline** — every important event emits an activity through one
  chokepoint, with an in-process subscription seam for future live updates.
- **Approval system** — request → decide (approve / reject / changes) with
  reviewer, comment, decision and timeline events.

---

## 🎯 Sprint 2 (next) — proposed scope

**Goal:** make the engine *write-complete and live* — full task execution,
real-time timelines, and the dependency/critical-path view.

### 1. Task execution loop (Day 1–4)

- [ ] Task + Epic services/controllers/validation (CRUD + status moves).
- [ ] Kanban board inside the Mission Workspace Tasks tab (drag to change
      status/position; persist via PATCH).
- [ ] On task completion: emit `TASK_COMPLETED` and call
      `missionService.recompute()` so progress + health update automatically.
- [ ] Wire `MissionService.recompute` into task mutations (today it is the
      manual "Recompute" action).

### 2. Live timeline (Day 3–6)

- [ ] SSE endpoint `GET /missions/:id/activity/stream` that subscribes to
      `missionEvents` and streams new activities.
- [ ] `useMissionActivityStream` hook; prepend events into the timeline live.
- [ ] Replace `router.refresh()` mutations with optimistic updates where it
      improves feel (keep refresh as the fallback).

### 3. Active workspace context (Day 2–3)

- [ ] Persist active workspace (cookie/URL segment); wire `WorkspaceSwitcher`.
- [ ] Replace `getActiveWorkspace()`'s "first membership" with the selection.

### 4. Dependencies & scheduling (Day 5–8)

- [ ] Dependency graph view; detect cycles on create.
- [ ] Critical-path / blocked-by rollup feeding `MissionHealth = BLOCKED`.
- [ ] "Blocked missions" dashboard drill-down.

### 5. Execution runs (Day 7–9)

- [ ] Activate BullMQ: `agent-run` / `workflow-execution` workers.
- [ ] `MissionExecution` lifecycle (PENDING→RUNNING→SUCCEEDED/FAILED) emitting
      `EXECUTION_STARTED` / `EXECUTION_COMPLETED`.
- [ ] Still **no LLM calls** — workers run deterministic stubs until the AI
      integration sprint.

### 6. Quality & hardening (ongoing)

- [ ] Vitest unit tests: `MissionService` transitions, `deriveHealth`,
      `MissionPolicies`, cross-tenant access rejection.
- [ ] Playwright e2e: create mission → request approval → approve → complete.
- [ ] CI: typecheck + lint + build + `prisma validate` + tests.
- [ ] Toasts (sonner) + per-section loading skeletons.

---

## Out of scope (later sprints)

- LLM / agent execution (no AI integration yet, by design).
- Billing, OAuth providers, workspace invitations.
- Workflow builder UI.

## Key risks

- **Progress/health consistency** under concurrent task edits → centralize all
  rollups in `MissionService.recompute`; never mutate progress elsewhere.
- **Activity volume** → the timeline is append-only and indexed on
  `(mission_id, created_at)`; add retention/partitioning before millions of
  rows accumulate.
- **Dependency cycles** → validate on write; surface clearly in the graph view.
