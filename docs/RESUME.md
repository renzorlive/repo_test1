# Resume — re-enter your work state instantly

> The problem was never "continue the project." It is **"help me re-enter my
> work state instantly."** So the product is not _Continue GOCO_. It is the more
> general verb: **Resume.**
>
> "Resume GOCO." "Resume ECUX." "Resume the SEO campaign." "Resume yesterday."
> "Resume client X." One sentence in, your work state back out.

This is the product nucleus — the first thing worth paying for. RNZ OS is the
interface; the thing doing the work underneath is **RNZ Memory**, and Resume is
its sharpest demo.

---

## 1. The Resume Package

Resume does **not** return "context." It returns a **structured re-entry
object** — everything you need to be productive again, in a fixed shape the UI
and an agent can both consume.

| Field                       | What it answers                                  |
| --------------------------- | ------------------------------------------------ |
| **Project**                 | What am I resuming?                               |
| **Last active**             | When did I last touch this?                      |
| **Current objective**       | What is this work for?                            |
| **You were doing**          | What was in flight when I stopped?               |
| **Blocked by**              | What stands between me and progress?             |
| **Recent decisions**        | How did I get here?                              |
| **Relevant files**          | What should I open first?                        |
| **Recommended next action** | The single best next step.                       |
| **Confidence**              | How much does the brain actually know? (4 dims)  |
| **Estimated time to resume**| How long until I'm productive again?             |
| **Summary**                 | One-paragraph human recap.                       |

Implemented as `ResumePackage` in
[`src/server/services/resume.service.ts`](../src/server/services/resume.service.ts),
served at `POST /api/workspaces/[id]/resume`, rendered at `/resume`.

---

## 2. Resume Snapshots — checkpoints, like a game save

At each important execution, RNZ Memory auto-generates a **Resume Snapshot**: a
checkpoint capturing what was done, where it stopped, what's next, what blocks
it, the important files, the decisions, and the minimal context to keep going.

The next "Resume …" **loads the last checkpoint and only fills in the diffs**
instead of reconstructing everything from scratch — fast, and resilient.

- Model: `ResumeSnapshot` (`prisma/schema.prisma`) — a full Resume Package
  blob plus its summary, indexed by workspace / project / mission and time.
- Written by `resumeService.snapshot(missionId)`, called at the boundary the
  Mission Brain stops on (end of `missionBrainService.advance`). A checkpoint
  failure never breaks execution.

---

## 3. Confidence v2 — four dimensions, not one number

A single confidence score hid the truth. The brain can be sure it can **plan**
yet sure it **cannot deploy** without credentials. So confidence splits into
four scored dimensions, each with its own threshold and explainable signals:

| Dimension      | The brain is asking…                          | Threshold |
| -------------- | --------------------------------------------- | --------- |
| **Knowledge**  | Do I know enough about this? (PRD, decisions, code, prior runs) | 80% |
| **Planning**   | Can I plan it? (objective, plan, tasks)       | 80%       |
| **Execution**  | Can I do the work? (workers, tasks, codebase) | 75%       |
| **Deployment** | Can I ship it? (target, production credentials) | 90%     |

Deployment defaults to ~0 until a target and credentials exist — exactly the
"I can plan this myself, but I can't deploy without credentials" case. The
autonomous gate keys off the **Execution** dimension.

See [`src/lib/confidence.ts`](../src/lib/confidence.ts) and the four-ring
`ConfidencePanel`.

---

## 4. The question is "accomplish", not "build"

The central prompt changed from _"What do you want to build?"_ to **"What do you
want to accomplish?"** — because the outcomes aren't all code:

> Launch GOCO · Improve SEO · Fix bug #421 · Publish a TikTok · Analyze
> competitors · Prepare the investor meeting.

---

## 5. Roadmap — five capabilities, no new infrastructure

1. **Resume Engine** — sentence → Resume Package. _(shipped)_
2. **Resume Snapshots** — auto-checkpoints at each execution. _(shipped)_
3. **Memory Source #1 (LOCAL/GitHub)** — the adapter seam that feeds retrieval
   from real sources. _(seam in [`src/server/memory/source.ts`](../src/server/memory/source.ts); LOCAL first, GitHub next)_
4. **Intent Resolution** — bare sentence → target + action, with aliases and
   the "Resume yesterday" fallback. _(fallback shipped; fuzzy/alias next)_
5. **Confidence v2** — per-dimension, explainable, risk-aware gating. _(shipped)_

The next sprint is capability 3: index the actual repo + decisions so "Resume
GOCO" passes on real GOCO data. Nothing else.
