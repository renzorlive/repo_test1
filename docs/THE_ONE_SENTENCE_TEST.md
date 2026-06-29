# The One Sentence Test

> **RNZ OS lets founders continue any project with one sentence because it
> remembers everything that matters.**

That sentence is the product. Before anything ships, it answers to this:

> **Does this help the sentence? If not, it does not go in the product.**

---

## The aha moment

Not 15 pages. Not 30 APIs. This:

> You wipe your AI's context. You open RNZ OS. You type **"Continue GOCO."**
> In five seconds you have weeks of context back — the decisions, the files, the
> state, the next steps — and the system offers to keep going.

That is what someone pays **30 €/month** for: _never re-explaining your project
to an AI again._

---

## The test protocol (run it, don't theorize)

1. Take a real project (GOCO).
2. Wipe all context from the assistant.
3. Open RNZ OS, type only: **"Continue GOCO."**
4. The system must, with no further input:
   - identify the project,
   - find where it left off (last mission, stage, branch),
   - recall the last decisions, the PRD/context, the relevant files,
   - summarize what happened,
   - propose the next steps,
   - state its **confidence**, and execute if it's high enough.

If it doesn't work, we **fix until it does** — we do not build anything new.

---

## Honest status (no overselling)

- ✅ **The experience exists today** at `/resume` (the verb generalized from
  "Continue X" to **Resume** — see [`RESUME.md`](RESUME.md)). Type a sentence →
  it resolves the project, rebuilds the mission's work state as a structured
  **Resume Package** (objective, what you were doing, what blocks you, decisions,
  files, the one next action, four-dimension confidence, time-to-resume), and
  offers Resume. This already passes the test **on data RNZ OS itself holds.**
- ⚠️ **The real test on _your_ GOCO** needs RNZ Memory to ingest the real
  sources (the repo, the conversations, the files). The recall is only as good
  as what's indexed. That is the gap — and it's a **Memory Source**, not a UI.

**Smallest path to a real pass:** one Memory Source that indexes the actual GOCO
repo + decisions (LOCAL or GitHub), feeding the existing `companyBrain`
retrieval. Nothing else is required for the test.

---

## Feature audit — does it help the sentence?

| What we built          | Helps the sentence? | Verdict for the core      |
| ---------------------- | ------------------- | ------------------------- |
| **Continue (recall)**  | ✅ It _is_ the sentence | **The product.**        |
| **Company Brain / Memory** | ✅ "remembers everything" | **The moat.** Invest. |
| **Confidence**         | ✅ "if confidence is enough, execute" | **Keep.**     |
| **Mission Brain**      | ✅ the "continue → execute" half | **Keep (engine).** |
| **Runtime / Claude Code** | ➖ needed to _execute_, not to _recall_ | **Defer to beat #2.** |
| **AI Orchestrator dashboards** | ❌ not on the sentence | **Hide from the core.** |
| **15 tabs in the Mission Workspace** | ❌ infrastructure | **Advanced Mode only.** |

The rule isn't "delete the code." It's: **the core experience is the sentence;
everything else is Advanced Mode or a later beat.**

---

## The three questions, from now on

For every sprint:

1. **Why would someone pay for this?**
2. **What does it make impossible-before or far easier?**
3. **How do you show the value in the first 5 minutes?**

If the answers are clear, the code is easy.

---

## The first demo is a video, not a dashboard

60 seconds. Someone types **"Continue GOCO."** The context reconstructs on
screen, the plan appears, execution begins. If that impresses a founder in the
first minute, we've found the nucleus worth building. The `/continue` screen is
the shot.
