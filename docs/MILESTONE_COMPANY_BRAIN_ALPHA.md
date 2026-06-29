# Milestone — Company Brain Alpha

> Renames and supersedes "Zero Context." The point was never that the AI
> executes — it's that the AI **knows when it can** execute and **when it must
> ask.**

## The definition of success

> RNZ OS knows enough about your company — from RNZ Memory and the project's own
> history — to **decide on its own** when it can execute autonomously and when it
> must ask you for the missing context.

Two canonical tests:

1. **Zero Context.** You write **"Continue GOCO."** — no files, no branch, no
   model, no prompt — and the right work runs because the brain resolved the
   intent and retrieved the context.
2. **Knows when it doesn't know.** When the brain lacks what it needs, it
   **pauses on its own** with an explained confidence score and asks for exactly
   what's missing — instead of guessing.

If both hold on real projects (GOCO, ECUX, RNZ Memory), the milestone is done —
and that's the moment to run RNZ OS for actual work.

## Why this is the differentiator

Anyone can call a model. Two things are hard, and we own both:

- **Context** — knowing what already happened (RNZ Memory / the knowledge graph).
- **Calibration** — knowing whether that context is _enough_ to act
  (Confidence).

Together they turn an agent orchestrator into _a system that uses the
organization's memory to make better decisions._ That is the long-term moat.

## What's already shipped (the spine exists)

- **Confidence** — the brain scores its readiness from explainable signals and
  refuses to auto-execute below 85%, recording what's missing. (`lib/confidence`,
  `companyBrain.assess`, `missionBrainService.confidenceGate`, the cockpit
  panel + "Execute anyway".)
- **Company Brain** seam (`server/brain/company-brain.ts`) with the five
  responsibilities; Retrieval delegates to the existing context builder.
- **Memory substrate** — decisions, artifacts, activity, AI sessions and runtime
  artifacts are already captured on every run (Learning, for free).

## What Company Brain Alpha still needs

### 1. Intent resolution
Map a bare sentence → target + action ("Continue GOCO" → project GOCO, resume
latest / start next). One question max when ambiguous; never a form.

### 2. RNZ Memory + Memory Sources
A `MemorySource` adapter interface (LOCAL first, then GitHub, Drive, Notion,
Slack, Email…) feeding a knowledge graph; retrieval ranks across sources by
relevance + recency. Plugs in behind `gatherMissionContextSources` — no engine
changes.

### 3. Confidence v2
Replace the heuristic signals with real evidence from retrieval (was the PRD
actually found? is the codebase indexed? is there a similar prior mission?), and
make the threshold **risk-aware** — a deploy needs higher confidence than a
draft.

## How we'll know it's real (measured on real work)

1. A bare sentence resolves to the right project + sensible action ≥ 9/10.
2. The opening summary accurately names the last decision, current state, and
   what's left — before acting.
3. When context is missing, the brain pauses itself and asks for the _right_
   thing (not a generic "tell me more").
4. The founder never supplies infrastructure (file, branch, model, prompt, host).

## Deliberately NOT in this milestone

- More execution infrastructure (enough exists).
- A manual knowledge-base UI (memory is a by-product of doing the work).
- Teams, billing, multi-tenant. One founder, real projects, first.

---

_Build the system that knows when it knows. Context is the moat; calibration is
the trust._
