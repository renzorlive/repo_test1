# RNZ OS — Autonomous Mission System

> A Mission is no longer a database object. It is an **autonomous manager** — a
> Mission Brain that owns planning, execution, workers, memory, progress, risks,
> approvals, artifacts, costs and the timeline.

This is the product principle from here on: **outcome-first, not AI-first.** The
user doesn't buy AI, Claude or runtimes — they buy *the homepage shipped, the
app finished, the campaign published.* AI is the internal mechanism.

## The one thing a founder does

State an outcome. On Mission Control:

> **"Launch GOCO Marketplace."** → Launch

That's it. The Mission Brain does everything else, automatically:

```
Goal → Planning → Architecture → Task Breakdown → Choose Workers →
Execute → Review → Fix → Commit → Deploy → Release Notes → Done
```

The founder **never** chooses a worker, provider, runtime, prompt or context.
They only **approve**.

## The Mission Brain

`missionBrainService` is the manager. From one objective it:

1. creates the **execution plan** (`MissionPlan`) and the **pipeline**
   (`MissionStage[]`),
2. generates milestones and **tasks**, records **decisions** and **architecture**,
3. **picks workers** itself (via the worker registry) and **launches executions**
   (the AI engine auto-selects provider/model and builds context + prompts),
4. **pauses only at approval gates** (Review, Deploy),
5. on rejection, routes to **Fix**; on approval, continues,
6. **commits**, **deploys**, **generates release notes**, and marks **Done** —
   completing the mission.

Every step is attributed to **"Mission Brain"** on the timeline, so the mission
reads like a manager narrating its work. The brain's memory *is* the mission
aggregate (decisions, tasks, executions, artifacts, activity) plus the plan.

It's an organization, not a chatbot:

```
Mission → Manager AI (the Brain) → Workers → Reviewers → Deployers
```

## Two modes

- **Founder Mode** (default) — the cockpit: pipeline, the brain's narration,
  deliverables, and a single primary action (**Approve & continue**). All
  infrastructure is hidden.
- **Advanced Mode** — the full execution surface: every tab (executions,
  prompts, context, workers, runtime, costs…). One toggle; the mission
  remembers the choice (`Mission.mode`).

`Mission.autonomy` (`MANUAL` / `SUPERVISED` / `AUTONOMOUS`) controls how far the
brain runs before pausing. Default is `SUPERVISED`: run everything, stop at
gates.

## How it maps to the rest of RNZ OS

The brain is pure orchestration — it reuses existing seams and adds **no new
infrastructure**:

- workers/provider/model selection → the AI Orchestrator (`workerRegistry`,
  `executionEngine`).
- real execution on a machine → the Runtime Layer (an execution can be sent to
  Claude Code on a host; the bridge rolls results back).
- context + prompts → the same provider-agnostic builders.

Schema: `Mission.mode`, `Mission.autonomy`, `MissionPlan`, `MissionStage`.
Service: `missionBrainService` (`launch`, `advance`, `approveStage`,
`rejectStage`, `setMode`). UI: `LaunchMission` (the hero input), `MissionCommand`
(the cockpit), `MissionPipeline`, `ModeToggle`.

> Build for business outcomes, not infrastructure. Think like the CEO of an
> autonomous AI company, not a workflow engine.
