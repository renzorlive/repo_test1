<div align="center">

# RNZ OS

**The AI Operating System for founders, agencies and AI-assisted software development.**

An execution platform that orchestrates projects, missions, AI agents and knowledge —
not a task manager, not a chat app.

**Start here → [The RNZ Manifesto](docs/MANIFESTO.md)** · the north star is
[Milestone Alpha: Zero Context](docs/MILESTONE_ALPHA_ZERO_CONTEXT.md).

</div>

---

## ✨ What this is

This repository contains the **foundation** of RNZ OS: a clean, enterprise-grade
Next.js 15 architecture with authentication, multi-tenant workspaces, a full
domain model, a layered backend (repositories → services → API) and a polished,
responsive UI with dark/light mode.

> AI integrations are intentionally **not** implemented yet. The agent/workflow
> layer is modeled and surfaced in the UI with mock data, ready to be wired up.

## 🧱 Tech stack

Next.js 15 (App Router) · TypeScript · TailwindCSS · shadcn/ui · PostgreSQL ·
Prisma · Auth.js (NextAuth v5) · TanStack React Query · Zod · Framer Motion ·
BullMQ (prepared).

## 🚀 Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then fill in DATABASE_URL + AUTH_SECRET

# 3. Set up the database
npm run db:generate
npm run db:migrate          # creates the schema
npm run db:seed             # demo workspace → demo@rnz.os / password123

# 4. Run
npm run dev                 # http://localhost:3000
```

## 📋 Scripts

| Script             | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start the dev server                 |
| `npm run build`    | Generate Prisma client + build       |
| `npm run typecheck`| `tsc --noEmit`                       |
| `npm run lint`     | ESLint                               |
| `npm run db:studio`| Open Prisma Studio                   |
| `npm run db:seed`  | Seed demo data                       |

## 📚 Documentation

**Vision (read first)**
- [`docs/MANIFESTO.md`](docs/MANIFESTO.md) — why RNZ OS exists; the principles
- [`docs/COMPANY_BRAIN.md`](docs/COMPANY_BRAIN.md) — Memory before AI; the Company Brain + Confidence
- [`docs/MILESTONE_COMPANY_BRAIN_ALPHA.md`](docs/MILESTONE_COMPANY_BRAIN_ALPHA.md) — the north star: knows when it can act vs must ask
- [`docs/MILESTONE_ALPHA_ZERO_CONTEXT.md`](docs/MILESTONE_ALPHA_ZERO_CONTEXT.md) — the retrieval/intent deep-dive
- [`docs/EXPERIENCE_SPRINTS.md`](docs/EXPERIENCE_SPRINTS.md) — how we build now (experiences, not features)
- [`docs/NAMING.md`](docs/NAMING.md) — Mission vs Initiative / Launch / Outcome

**Technical**
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layering, multi-tenancy, domain model
- [`docs/FOLDER_TREE.md`](docs/FOLDER_TREE.md) — annotated folder map
- [`docs/TODO.md`](docs/TODO.md) — what's not built yet
- [`docs/SPRINT_1.md`](docs/SPRINT_1.md) — suggested first sprint

## 🗺️ Routes

`/login` · `/register` · `/command-center` (Mission Control) · `/projects` ·
`/missions` · `/missions/[id]` (Mission Workspace — Founder/Advanced) ·
`/missions/[id]/execute` (Execution Wizard) · `/agents` · `/orchestrator`
(AI Orchestrator) ·
`/orchestrator/executions/[id]` · `/inbox` (AI Inbox) · `/machines` (Host
Dashboard) · `/machines/executions/[id]` (Live Terminal) · `/settings`

## 📐 Design principles

Apple-level polish · Linear simplicity · Notion flexibility · GitHub DX.
Built for long-term maintainability and scale.
