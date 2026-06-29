# RNZ OS — Remaining TODO

The foundation is intentionally scoped. This is the backlog of what is **not**
yet built, grouped by area. Items are roughly ordered by priority within each
group.

## 🚀 Execution Workspace (shipped — see docs/EXECUTION_WORKSPACE.md)

- [x] Mission Control homepage (large cards, running, approvals, weekly goals).
- [x] Single primary CTA "▶ Execute Mission" + full-screen 8-step wizard.
- [x] Context/prompt preview, live progress view, auto execution summary.
- [x] Milestone-based progress + proactive AI suggestions.
- [x] Mobile bottom nav; mobile-first wizard.
- [ ] Replace the "Simulate worker result" action once provider adapters exist.
- [ ] SSE live timeline (replace 2.5s polling in `useExecution`).
- [ ] Persist the chosen goal preset / multi-worker fan-out executions.

## 🎯 The product: "Continue X" (the One Sentence Test)

- [x] `/continue` — one sentence → resolve project, recall last decisions /
      files / activity / state, summarize, propose next steps, score confidence,
      offer Continue. Works on data RNZ OS holds today.
- [ ] **Make the real test pass on GOCO**: a Memory Source that indexes the
      actual repo + decisions (LOCAL/GitHub) feeding `companyBrain` retrieval.
      This is the whole next sprint — nothing else.
- [ ] Intent resolution v2 (fuzzy/aliases, action detection beyond "continue").
- [ ] The 60-second demo video: "Continue GOCO" reconstructs context live.

## 🧠 Company Brain — Memory before AI (next milestone)

- [x] Confidence: explainable self-score; brain refuses to auto-execute below
      85% and asks for missing context; founder "Execute anyway". (Decision
      Making — `lib/confidence`, `companyBrain`, `confidenceGate`, cockpit panel.)
- [x] Company Brain seam (`server/brain/company-brain.ts`) — 5 responsibilities.
- [ ] **Intent resolution**: bare sentence → project + action ("Continue GOCO").
- [ ] **RNZ Memory + Memory Sources**: adapter interface (LOCAL #1, then GitHub,
      Drive, Notion, Slack…) → knowledge graph; ranked retrieval.
- [ ] **Confidence v2**: signals from real retrieval evidence; risk-aware
      threshold (deploy needs more than a draft).
- See `docs/COMPANY_BRAIN.md` and `docs/MILESTONE_COMPANY_BRAIN_ALPHA.md`.

## 🧩 Autonomous Mission (shipped — see docs/AUTONOMOUS_MISSION.md)

- [x] One objective → the Mission Brain plans, breaks down, assigns workers,
      executes, and pauses only at approval gates.
- [x] MissionPlan + MissionStage pipeline; advance / approve / reject.
- [x] Founder Mode (cockpit) vs Advanced Mode (full tabs); mission remembers it.
- [x] Launch hero on Mission Control; outcome-first framing.
- [ ] Real planning/breakdown via an LLM (currently heuristic, deterministic).
- [ ] Auto-advance via BullMQ so the brain runs without a "Continue" nudge.
- [ ] Auto-route executions to a connected machine (Runtime) end to end.
- [ ] Cost/risk budgets that pause the brain automatically.

## 🖥️ Runtime Layer (shipped — see docs/RUNTIME_LAYER.md)

- [x] Mission-agnostic runtime abstractions (host, runtime, session, command,
      execution, heartbeat, artifact, log, terminal, capability).
- [x] RuntimeAdapter interface + Claude Code adapter (Runtime #1).
- [x] Generic job state machine + token-authenticated remote-agent protocol.
- [x] Host Dashboard, live terminal, "Run on machine", connect-machine token.
- [x] Bridge: runtime results → mission artifacts + timeline.
- [ ] Ship the actual `rnz-agent` binary (claims jobs, runs Claude Code, reports).
- [ ] Activate BullMQ for runtime dispatch + stale-session reaping.
- [ ] SSE streaming for the terminal (replace 2s polling).
- [ ] Additional adapters: Codex CLI, Gemini CLI, Cursor CLI, Docker, SSH.
- [ ] Secret-scoped agent tokens with rotation + revocation.

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

- [x] Mission detail view (Mission Workspace) on live data + progress rollup.
- [x] Dashboard rebuilt on live workspace aggregates.
- [x] Missions list on live data.
- [ ] Swap Projects + Agents pages from `lib/mock-data.ts` to React Query hooks.
- [ ] Project detail view (board + list).
- [ ] Task + Epic CRUD + drag-and-drop Kanban (status columns).
- [ ] Decision and Artifact create/edit flows (read views shipped).
- [ ] Optimistic updates + toasts on mutations (currently `router.refresh()`).

## 🤖 AI Orchestrator (no live provider calls yet, by design)

- [x] Provider-agnostic execution platform: registry, engine, builders, inbox,
      dashboard (Sprint 3).
- [x] Execution state machine with per-transition timestamps + event timeline.
- [x] Provider Adapter Interface + registry (no implementations yet).
- [ ] Implement provider adapters (OpenAI, Anthropic, …) in `packages/ai-providers`.
- [ ] Activate BullMQ: drain an `ai-execution` queue; workers call adapters and
      report via `complete()` / `fail()` (see SPRINT_3.md).
- [ ] SSE streaming for live execution timelines + token output.
- [ ] Per-workspace / per-mission cost budgets + alerting.
- [ ] Workflow builder UI (node/edge editor over `Workflow.definition`).

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
