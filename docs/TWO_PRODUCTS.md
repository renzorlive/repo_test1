# Two Products

> There aren't one product here. There are two — and that's the bigger market.

## RNZ Memory — the knowledge engine (B2B)

**What:** the context layer. A knowledge graph of a company, fed by Memory
Sources, with retrieval and calibration (Confidence).

- **Shape:** API + SDK. Headless.
- **Sources:** LOCAL · GitHub · Google Drive · Notion · Slack · Email ·
  Filesystem · Documents · Audio · Video · Meetings · Calendar · PDF · Web.
- **Surface:** "give me the relevant context for _this intent_, ranked, with a
  confidence score and what's missing."
- **Buyers:** anyone building an AI product who needs real company context —
  other apps, agencies, internal tools. **They can consume RNZ Memory without
  RNZ OS.**
- **Why it's valuable:** everyone can call a model; almost no one has clean,
  ranked, calibrated company memory behind it.

## RNZ OS — the execution experience (UX)

**What:** the interface a founder lives in. Missions, approvals, the autonomous
brain, mobile, "Continue X."

- **Shape:** the app. Opinionated, outcome-first.
- **Consumes:** RNZ Memory for all context and calibration.
- **Buyers:** founders running companies with AI.
- **Why it's valuable:** it turns memory + AI into shipped outcomes from a
  sentence on a phone.

## The relationship

```
                ┌────────────── other apps, agencies, tools
                │
RNZ Memory ◄────┤  (API / SDK)
   ▲            │
   │ consumes   └────────────── RNZ OS  (the flagship consumer)
   │
RNZ OS
```

RNZ OS is the first and best consumer of RNZ Memory — the proof and the demo.
But the engine is sellable on its own, to a much larger market than "founders
who want our UI."

## Where the boundary is (in this codebase, today)

The seam already exists and should be kept clean:

- `server/brain/company-brain.ts` — the Memory/Retrieval/Decision surface. This
  is the future RNZ Memory API boundary.
- `server/ai/context-sources.ts` + a future `MemorySource` adapter interface —
  ingestion (LOCAL #1, then GitHub, Drive…), same pattern as runtime/provider
  adapters.
- `lib/confidence.ts` — calibration, pure and portable.

Everything mission/approval/UI is **RNZ OS**, and consumes the above.

## Build discipline (don't split prematurely)

- Build RNZ Memory as a **clean internal module with an API-shaped boundary**
  now. Do **not** spin up a second repo/service until there is a real second
  consumer — premature platforms die.
- The monorepo-readiness already in the architecture (path aliases, layered
  `server/**`) means extraction later is a move, not a rewrite.
- Sell the experience (RNZ OS) first to prove the value; open the engine (RNZ
  Memory API) once a second buyer is asking for it.

## The business reframe

From here, every decision is judged on **distribution and value**, not
architecture:

1. Why would someone pay?
2. What does it make impossible-before or far easier?
3. How do you show value in the first 5 minutes?

RNZ Memory answers #1 and #2 for a wide market. RNZ OS answers #3 with the
sharpest possible demo: **"Continue GOCO."**
