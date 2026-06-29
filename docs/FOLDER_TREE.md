# RNZ OS — Folder tree

Annotated map of the codebase. The structure encodes the layered architecture
(see `ARCHITECTURE.md`): UI → API → controllers → services (+ policies/events)
→ repositories → data. The **Mission Engine** is the center of gravity.

```
rnz-os/
├── prisma/
│   ├── schema.prisma            # Models, enums, indexes — Mission Engine core
│   ├── seed.ts                  # Realistic mission-centric demo data
│   └── migrations/
│       ├── migration_lock.toml
│       └── 20260628170000_mission_engine_init/migration.sql
│
├── src/
│   ├── app/
│   │   ├── (auth)/              # Public auth route group (login, register)
│   │   ├── (dashboard)/         # Authenticated app shell
│   │   │   ├── command-center/page.tsx     # Dashboard (live aggregates)
│   │   │   ├── missions/page.tsx            # Mission list (live)
│   │   │   ├── missions/[missionId]/page.tsx # Mission Workspace (live)
│   │   │   ├── projects/page.tsx            # (mock — pending wiring)
│   │   │   ├── agents/page.tsx              # (mock — pending wiring)
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/
│   │       ├── auth/**                              # Auth.js + register
│   │       └── workspaces/[workspaceId]/
│   │           ├── dashboard/route.ts               # GET overview
│   │           ├── projects/**                      # projects CRUD
│   │           ├── agents/**                        # agents CRUD
│   │           └── missions/
│   │               ├── route.ts                     # GET list / POST create
│   │               └── [missionId]/
│   │                   ├── route.ts                 # GET aggregate / PATCH / DELETE
│   │                   ├── recompute/route.ts       # POST recompute rollups
│   │                   ├── context/route.ts         # PATCH working context
│   │                   ├── milestones/route.ts      # POST milestone
│   │                   ├── activity/route.ts        # GET timeline
│   │                   ├── approvals/route.ts       # GET / POST
│   │                   ├── approvals/[approvalId]/route.ts   # PATCH decide
│   │                   ├── notes/route.ts           # GET / POST
│   │                   ├── dependencies/route.ts    # POST
│   │                   ├── metrics/route.ts         # GET / POST
│   │                   ├── ai-sessions/route.ts     # GET / POST
│   │                   └── ai-sessions/[sessionId]/route.ts  # PATCH
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (+ textarea)
│   │   ├── layout/              # sidebar, top-nav, workspace-switcher…
│   │   ├── mission/             # Mission Engine UI
│   │   │   ├── mission-workspace.tsx   # Command-center: 14 sectioned tabs
│   │   │   ├── mission-header.tsx      # Lifecycle controls (status/recompute)
│   │   │   ├── activity-feed.tsx       # Append-only timeline renderer
│   │   │   ├── approvals-panel.tsx     # Approve / reject / request changes
│   │   │   ├── ai-sessions-panel.tsx   # Start + list AI sessions
│   │   │   ├── notes-panel.tsx         # Add + list notes
│   │   │   └── health-badge.tsx        # Health signal indicator
│   │   ├── dashboard/           # stat-card
│   │   ├── auth/ · settings/ · motion/ · providers/
│   │   ├── page-header.tsx · status-badge.tsx · empty-state.tsx
│   │   └── theme-toggle.tsx
│   │
│   ├── server/                  # Backend (framework-agnostic)
│   │   ├── controllers/
│   │   │   └── mission.controller.ts   # HTTP↔service mapping for all sub-resources
│   │   ├── policies/
│   │   │   └── mission.policy.ts        # Role-ranked capability checks
│   │   ├── events/
│   │   │   └── mission-events.ts        # Activity dispatcher + live-update seam
│   │   ├── services/
│   │   │   ├── mission.service.ts        # Lifecycle, rollups, context, milestones
│   │   │   ├── mission-access.ts         # Shared tenancy+capability guard
│   │   │   ├── mission-activity.service.ts
│   │   │   ├── mission-approval.service.ts
│   │   │   ├── mission-note.service.ts
│   │   │   ├── mission-dependency.service.ts
│   │   │   ├── mission-metric.service.ts
│   │   │   ├── ai-session.service.ts
│   │   │   ├── dashboard.service.ts      # Workspace command-center aggregates
│   │   │   ├── workspace/project/agent.service.ts
│   │   │   └── access.ts                 # requireUser / requireMembership
│   │   ├── repositories/        # Prisma only here (one per aggregate)
│   │   │   ├── mission.repository.ts      # core + aggregate + rollups
│   │   │   ├── mission-activity / -approval / -note / -dependency / -metric
│   │   │   ├── ai-session.repository.ts
│   │   │   ├── dashboard.repository.ts    # indexed dashboard queries
│   │   │   └── workspace/project/agent.repository.ts
│   │   ├── errors.ts            # Typed domain errors
│   │   └── http.ts              # ok() / route() / handleError()
│   │
│   ├── hooks/                   # React Query + mission action hooks
│   │   ├── use-mission-actions.ts        # Mission Workspace mutations
│   │   └── use-projects / use-agents / use-missions.ts
│   ├── lib/
│   │   ├── prisma · auth · auth.config · env · queue · api-client · utils
│   │   ├── active-workspace.ts  # Resolve active workspace (server)
│   │   └── mock-data.ts         # Projects/Agents fixtures (pending wiring)
│   ├── validations/             # Zod (mission, mission-engine, ai, …)
│   ├── types/ · config/
│   └── middleware.ts            # Edge auth gate
│
└── docs/
    ├── ARCHITECTURE.md · FOLDER_TREE.md (this) · TODO.md
    ├── SPRINT_1.md · SPRINT_2.md · SPRINT_3.md
```

## AI Orchestrator additions

```
src/
├── server/
│   ├── ai/                              # Orchestration core (provider-agnostic)
│   │   ├── execution-engine.ts          # The generic state machine
│   │   ├── context-builder.ts           # Pure context assembler (the heart)
│   │   ├── prompt-builder.ts            # Versioned, hashed prompt builder
│   │   ├── worker-registry.ts           # Capability/priority/concurrency scheduler
│   │   ├── tokens.ts                    # Token + cost estimation
│   │   ├── types.ts                     # ContextPackage / PromptPackage
│   │   └── providers/
│   │       ├── types.ts                 # AiProviderAdapter interface
│   │       └── registry.ts              # Adapter registry (empty by design)
│   ├── controllers/ai.controller.ts     # HTTP↔service mapping
│   ├── policies/ai.policy.ts            # Role-ranked AI capabilities
│   ├── services/
│   │   ├── ai-execution.service.ts      # Authorized facade over the engine
│   │   ├── ai-worker / ai-provider / ai-queue.service.ts
│   │   ├── ai-inbox.service.ts          # Six triage lanes
│   │   ├── ai-dashboard.service.ts      # Orchestrator metrics
│   │   └── ai-access.ts                 # Tenancy + capability guard
│   └── repositories/
│       ├── ai-execution.repository.ts   # Aggregate + child writes
│       ├── ai-worker / ai-provider / ai-queue.repository.ts
│       └── ai-dashboard / ai-inbox.repository.ts
│
├── app/(dashboard)/
│   ├── orchestrator/page.tsx                       # Dashboard + worker registry
│   ├── orchestrator/executions/[executionId]/page.tsx  # Execution detail
│   └── inbox/page.tsx                              # AI Inbox
├── app/api/workspaces/[workspaceId]/ai/**          # providers, models, workers,
│                                                   # queues, executions (+actions),
│                                                   # inbox, dashboard
├── components/ai/                                  # worker-registry, inbox-board,
│                                                   # execution-{state-badge,event-feed,actions}
├── hooks/use-execution-actions.ts
└── validations/ai.ts
```
