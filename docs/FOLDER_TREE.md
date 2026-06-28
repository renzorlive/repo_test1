# RNZ OS — Folder tree

Annotated map of the foundation. The structure encodes the layered
architecture (see `ARCHITECTURE.md`): UI → API → services → repositories → data.

```
rnz-os/
├── prisma/
│   ├── schema.prisma            # All models, enums, indexes, relations
│   └── seed.ts                  # Demo workspace/user/project/mission/agent
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout: fonts + Providers
│   │   ├── page.tsx             # Redirects to /command-center
│   │   ├── globals.css          # Design tokens (light/dark) + base styles
│   │   │
│   │   ├── (auth)/              # Public auth route group
│   │   │   ├── layout.tsx       # Split-screen brand + form shell
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   │
│   │   ├── (dashboard)/         # Authenticated app shell route group
│   │   │   ├── layout.tsx       # Sidebar + TopNav + scroll region
│   │   │   ├── command-center/page.tsx
│   │   │   ├── projects/page.tsx
│   │   │   ├── missions/page.tsx
│   │   │   ├── agents/page.tsx
│   │   │   └── settings/page.tsx
│   │   │
│   │   └── api/                 # HTTP boundary (route handlers)
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts   # Auth.js handlers
│   │       │   └── register/route.ts        # Sign-up + default workspace
│   │       └── workspaces/
│   │           ├── route.ts                          # GET list / POST create
│   │           └── [workspaceId]/
│   │               ├── projects/route.ts             # GET / POST
│   │               ├── projects/[projectId]/route.ts # GET / PATCH / DELETE
│   │               ├── missions/route.ts             # GET / POST
│   │               ├── agents/route.ts               # GET / POST
│   │               └── agents/[agentId]/route.ts     # GET / PATCH / DELETE
│   │
│   ├── components/
│   │   ├── ui/                  # shadcn/ui primitives (button, card, …)
│   │   ├── layout/              # sidebar, top-nav, workspace-switcher, user-menu
│   │   ├── auth/                # login-form, register-form
│   │   ├── dashboard/           # stat-card and other dashboard widgets
│   │   ├── settings/            # appearance-settings
│   │   ├── motion/              # framer-motion wrappers (fade-in)
│   │   ├── providers/           # Session + React Query + Theme providers
│   │   ├── page-header.tsx      # Shared page title block
│   │   ├── status-badge.tsx     # Centralized status/priority → badge mapping
│   │   └── theme-toggle.tsx
│   │
│   ├── server/                  # Backend, framework-agnostic
│   │   ├── repositories/        # Prisma data access (one per aggregate)
│   │   ├── services/            # Business logic + authorization
│   │   │   └── access.ts        # requireUser / requireMembership guards
│   │   ├── errors.ts            # Typed domain errors (App/NotFound/Forbidden…)
│   │   └── http.ts              # ok() / route() / handleError() helpers
│   │
│   ├── hooks/                   # React Query hooks (use-projects, use-agents…)
│   ├── lib/                     # Cross-cutting infrastructure
│   │   ├── prisma.ts            # Singleton Prisma client
│   │   ├── auth.ts              # Auth.js (Node): adapter + credentials
│   │   ├── auth.config.ts       # Auth.js (Edge-safe) for middleware
│   │   ├── env.ts               # Zod-validated environment variables
│   │   ├── queue.ts             # BullMQ registry (PREPARED, inactive)
│   │   ├── api-client.ts        # Typed fetch wrapper for hooks
│   │   ├── mock-data.ts         # Fixtures powering the UI today
│   │   └── utils.ts             # cn, slugify, getInitials, formatRelativeTime
│   │
│   ├── validations/             # Zod schemas (auth, workspace, project, …)
│   ├── types/                   # Domain types + next-auth augmentation
│   ├── config/                  # navigation.ts, site.ts
│   └── middleware.ts            # Edge auth gate for all app routes
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FOLDER_TREE.md           # (this file)
│   ├── TODO.md
│   └── SPRINT_1.md
│
├── components.json              # shadcn/ui config
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── .env.example
└── package.json
```
