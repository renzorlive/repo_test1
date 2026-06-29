# Milestone Alpha — Zero Context

> **Renamed & expanded → [Company Brain Alpha](./MILESTONE_COMPANY_BRAIN_ALPHA.md).**
> Zero Context is one half of it ("one sentence, right work"); the other half is
> Confidence ("knows when it doesn't know"). This doc remains the deep-dive on
> the retrieval/intent side. See also [`COMPANY_BRAIN.md`](./COMPANY_BRAIN.md).

> The next milestone is not "Sprint 6." It is this.

## The definition of success

> The user writes **one sentence**, and RNZ OS has enough context — from RNZ
> Memory and the project's own history — to execute correctly **without any
> further explanation.**

The canonical test:

> **"Continue GOCO."**

No files attached. No branch chosen. No model picked. No prompt written. The
mission runs correctly because the system already knows what GOCO is and where
it left off.

If that works, RNZ OS is genuinely different from almost everything in AI today.
If it doesn't, no other feature matters yet.

---

## Why this is the moat

Anyone can call a model. The prompt was never the hard part. The hard part is
**knowing what already happened**:

- the last decisions and why,
- the architecture and the PRD,
- the relevant files and their state,
- the conversations,
- who worked on it last, and what's left.

That body of knowledge is **RNZ Memory**. Nobody else has it. The product
becomes irreplaceable the moment a single sentence is enough — because the value
isn't the generation, it's the context behind it.

**Principle:** _Context over Prompts. Memory is the product._

---

## What we already have (the seams are in place)

The platform is, conveniently, already shaped for this:

- **`contextBuilder`** assembles a structured, provider-agnostic context package
  from workspace, project, mission, recent decisions, artifacts, notes and prior
  AI sessions.
- **`gatherMissionContextSources`** is the single gather point both the engine
  and the wizard preview use — exactly where a richer memory source plugs in.
- **`MissionContext`**, decisions, artifacts, activity timeline, AI sessions and
  runtime artifacts already persist per mission/project.
- **The Mission Brain** already turns an objective into a planned, executing
  mission.

So Zero Context is **not** a rewrite. It is two new capabilities feeding
existing seams.

---

## What's missing (the two new capabilities)

### 1. Intent resolution ("which thing is GOCO?")

Today a mission is launched with an explicit objective. Zero Context needs a
resolver that maps a **bare sentence** to a **target + intent**:

- _"Continue GOCO"_ → project **GOCO**, intent **resume the latest mission /
  start the next obvious one**.
- _"Fix the GOCO checkout bug"_ → project **GOCO**, intent **new mission scoped
  to checkout**, seeded with the relevant files/decisions.

This is a small, high-leverage service: match the sentence against known
projects/missions (name, aliases, recency, ownership), pick the most likely
target, and infer the action. When ambiguous, ask **one** question — never a
form.

### 2. Memory retrieval (feed the builder with the _right_ slice)

`contextBuilder` already assembles context, but Zero Context needs it to pull
**the relevant slice**, ranked, possibly from an external **RNZ Memory** store
(embeddings / prior projects / conversations) — not just the mission's own rows.

Concretely: a `MemorySource` interface behind `gatherMissionContextSources` that
can resolve "the files, decisions and conversations relevant to _this_ sentence"
and rank them by recency + relevance. RNZ Memory becomes Memory Source #1, the
same way Claude Code is Runtime #1.

---

## The experience we're building toward

```
You type:        "Continue GOCO."
RNZ OS resolves: project GOCO · last mission "Marketplace v1" · paused at Deploy
RNZ OS recalls:  last 6 decisions · architecture · 3 relevant files · who worked last
Mission Brain:   "Resuming GOCO Marketplace. Next: Deploy. Approve?"
You:             ✅
```

One sentence in. The right work out. Zero context supplied by you.

---

## How we'll know it's real

Pass/fail, measured on **real projects**, not demos:

1. **One sentence, correct target.** For GOCO, ECUX and RNZ Memory, a bare
   sentence resolves to the right project + a sensible next action ≥ 9/10 times.
2. **No clarifying forms.** At most **one** question when genuinely ambiguous.
3. **Context recall the founder trusts.** The brain's opening summary names the
   last decision, the current state, and what's left — accurately — before doing
   anything.
4. **Founder never supplies infrastructure.** No file, branch, model, prompt or
   host chosen by hand.

When all four hold for your real companies, Milestone Alpha is done — and that
is the moment to start using RNZ OS for actual work, because it's validated on
real context, not on a seed.

---

## What this milestone is deliberately NOT

- Not more execution infrastructure (we have enough).
- Not a knowledge-base UI to manually curate (memory is captured as a
  by-product of doing the work, not data-entry).
- Not multi-tenant, teams, or billing. One founder, real projects, first.

---

_If we build one thing next, build the sentence that needs no explanation._
