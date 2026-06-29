# The Company Brain

> RNZ OS is the interface. **RNZ Memory is the product.**
> Memory comes _before_ the AI.

This is the architectural inversion that makes RNZ OS fundamentally different
from every "prompt → LLM → result" tool.

## The inversion

What we had:

```
RNZ OS → Mission Brain → AI → Runtime → Claude
```

What it should be:

```
RNZ OS
  └─ Mission Brain
       └─ RNZ Memory          ← memory is first
            └─ Company Brain   (Context Engine)
                 └─ Planner
                      └─ AI Workers
                           └─ Runtime
```

Everyone else builds:

```
User → Prompt → LLM → Result
```

We build:

```
User → Intent → Memory → Knowledge → Planning → Execution → Result
```

The prompt is no longer the product. **The prompt is an internal artifact.**

## The Company Brain (formerly "Context Builder")

"Context Builder" was too small a name — building a context package is just one
function. The organ has **five responsibilities**:

1. **Memory** — everything the company knows.
2. **Retrieval** — pull the _relevant_ slice for an intent.
3. **Planning** — turn an objective into a plan.
4. **Decision Making** — know when it can act vs must ask (**Confidence**).
5. **Learning** — fold outcomes back into memory.

In code: `src/server/brain/company-brain.ts` is the seam. Today **Decision
Making (Confidence)** is implemented; Retrieval delegates to the existing
context builder; Planning is the Mission Brain; Learning is the activity/
decision/artifact substrate already captured on every run. Memory grows into
RNZ Memory below.

## RNZ Memory — a knowledge graph, not a database

RNZ Memory is the company's knowledge graph, fed by many **Memory Sources** —
the same adapter pattern as runtimes (Claude Code was Runtime #1; LOCAL is
Memory Source #1):

```
LOCAL · GitHub · Google Drive · Notion · Slack · Email · Filesystem ·
Documents · Audio · Video · Meetings · Calendar · PDF · Web
```

Each source is an adapter that ingests and indexes into the graph; retrieval
ranks across all of them. Nothing about this couples to a vendor — it is the
Memory-Source-#N interface, exactly like the runtime and provider adapters.

## Zero Context, made simple

Because Memory is first, the "Continue GOCO" experience becomes a pipeline, not
a prompt:

```
Intent Resolver → Find Project → Retrieve Memory → Retrieve Decisions →
Retrieve Code → Retrieve Artifacts → Generate Plan → Execute
```

The user supplies a sentence. The brain supplies the context.

## Confidence — knowing when it doesn't know

The single most important behavior: before executing autonomously, the brain
**scores itself** and explains why.

```
Confidence 96%
  ✓ PRD found
  ✓ Architecture found
  ✓ Previous conversations found
  ✓ Codebase indexed
  ✓ Similar mission found
  ⚠ Deployment credentials
  ⚠ Production environment
```

Below the threshold (**85%**), the brain does **not** execute on its own. It
pauses and asks for the missing context — or the founder can override
("Execute anyway"). This fixes the deepest flaw of AI agents: _they don't know
when they don't know._

Implementation (shipped, heuristic — LLM later):

- `src/lib/confidence.ts` — pure, explainable scorer (signals + weights),
  shared by the server gate and the client cockpit.
- `companyBrain.assess()` / `confidence()` — the Decision Making responsibility.
- `missionBrainService.confidenceGate()` — pauses the autonomous pipeline before
  the EXECUTION stage when `score < 85` (unless autonomy is MANUAL or the
  founder overrode it). Records what's missing and narrates it on the timeline.
- UI: a Confidence panel in the Founder cockpit (score ring + signals), and a
  "needs more context" gate with **Execute anyway**.

## The redefined milestone

The next milestone is no longer "Zero Context." It is **Company Brain Alpha**:

> Success is not that the AI executes. Success is that the AI knows enough about
> your company to decide _on its own_ when it can execute and when it must ask.

See [`MILESTONE_COMPANY_BRAIN_ALPHA.md`](./MILESTONE_COMPANY_BRAIN_ALPHA.md).
