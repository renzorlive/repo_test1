# The RNZ Manifesto

_Why RNZ OS exists._

This is not a PRD. It is not an architecture doc. It is the thing we read before
every decision, to remember what we are actually building — and what we are
refusing to build.

---

## 1. Why it exists

Building a company is the act of turning **one objective** into **a shipped
outcome**, over and over, across many fronts at once.

Today that work is scattered across twenty tools and a hundred tabs. AI was
supposed to help. Instead it gave us one more chat window — a brilliant intern
with no memory, no mandate, and no idea what we shipped yesterday.

RNZ OS exists to collapse that. To make the distance between **"I want this"**
and **"it's done"** as short as a sentence.

> You should be able to open RNZ OS, say what you want, and watch a company's
> worth of work get done — by AI, supervised by you, from your phone.

That is the whole product. Everything else is mechanism.

---

## 2. What it is

RNZ OS is the **operating system for building companies with AI.**

- It treats **AI as a workforce**, not as a feature.
- It treats a **Mission** (an objective) as a **manager** — an autonomous agent
  that plans, assigns work, executes, and reports — not as a row in a database.
- It treats **humans as the decision-makers** — you approve, you steer; you do
  not babysit.
- It treats **outcomes** as the unit of value — the site launched, the app
  finished, the campaign published — not tokens, prompts or runtimes.

It is an **execution platform**: objective in, outcome out.

---

## 3. What it is NOT

We will say no to these every single time:

- ❌ It is **not a chat.** Conversation is an input, not the product.
- ❌ It is **not Jira / a task manager.** We don't manage tickets; we ship
  outcomes. Tasks are an implementation detail the Mission Brain owns.
- ❌ It is **not Notion.** It is not a place to store documents you'll never
  re-read. Knowledge exists to be _executed against_.
- ❌ It is **not an IDE.** The work happens on real machines (Runtime Layer);
  RNZ OS is the command deck above them, not the editor.
- ❌ It is **not an AI wrapper.** No model is the product. Providers and
  runtimes are interchangeable mechanism behind adapters.

If a feature makes RNZ OS look like one of these, it is the wrong feature.

---

## 4. Who it is for

The first user is **you. One person. The founder.**

Not "everyone." Not "teams." Not "the enterprise." Those come later, or never.

We are building for the person who is running several companies at once, who
makes decisions in the gaps between meetings, who needs to move a launch forward
while waiting for a coffee in Brașov — and who has the context in their head
that no tool has ever had access to.

If it is not effortless for that one person, it is not done.

---

## 5. The principles

These are load-bearing. When two options conflict, the higher principle wins.

1. **Outcome over AI.** The user buys the launched site, not "Claude." AI is the
   internal engine; it should be invisible by default.
2. **Missions over Tasks.** We think in objectives, not tickets. The Mission is
   the source of truth and the manager.
3. **Context over Prompts.** The hard part was never the prompt. It is knowing
   _what already happened_. Context is the moat.
4. **Approval over Supervision.** The human makes decisions and approves. The
   human does not micromanage execution.
5. **AI is Workforce.** Workers, reviewers, deployers — an organization, not a
   chatbot. The Mission is their manager.
6. **Humans make decisions.** Autonomy never means abdication. Every
   irreversible step has a human gate.
7. **Mobile-first management.** The founder manages from a phone. If it needs a
   desktop, it is built wrong.
8. **One Objective. One Button. One Outcome.** The default interaction is a
   single sentence and a single approval.
9. **Memory is the product.** What RNZ OS remembers is worth more than what any
   model can generate. (See Milestone Alpha: Zero Context.)
10. **Boring infrastructure, magical experience.** The plumbing is rigorous and
    invisible. The surface feels like magic.

---

## 6. The shape of the product

The entire interaction model, in one line:

> **One Objective → One Button → One Outcome.**

You state an objective ("Launch GOCO Marketplace"). The Mission Brain plans,
breaks it down, assigns workers, executes on real machines, and pauses only when
it needs a decision. You approve. It ships.

Two modes, because the same product serves two moods:

- **Founder Mode** — the cockpit. Pipeline, narration, deliverables, one
  approve button. Zero infrastructure visible.
- **Advanced Mode** — the full execution surface, for when you want to look
  under the hood.

The default is Founder Mode. Advanced is opt-in, always.

---

## 7. The north star: Zero Context

The deepest version of this product is one where you write:

> **"Continue GOCO."**

…and nothing else. No files attached. No branch chosen. No model picked. No
prompt written. Because RNZ OS already knows:

- the last decisions made,
- the architecture,
- the PRD and the conversations,
- the relevant files,
- the state of the implementation,
- who worked on it last, and what's left.

That is **RNZ Memory**, and it is the real moat. Anyone can call a model. Nobody
else has your context. The product becomes irreplaceable the moment a single
sentence is enough.

This is the milestone that matters next — not "Sprint 6." See
[`MILESTONE_ALPHA_ZERO_CONTEXT.md`](./MILESTONE_ALPHA_ZERO_CONTEXT.md).

---

## 8. How we build from here

We change how we measure progress.

- **Before:** "Did we ship the feature?" (counting functions)
- **Now:** "Did we ship the experience?" (measuring the founder's reality)

Sprints become **experiences with a pass/fail bar**, not feature lists:

- _Can Andrei launch GOCO while eating at a restaurant in Brașov?_
- _Can Andrei approve a Claude execution in under 10 seconds?_
- _Can Andrei understand the state of every company in under 30 seconds?_

If the answer is no, the sprint fails — no matter how much code shipped. See
[`EXPERIENCE_SPRINTS.md`](./EXPERIENCE_SPRINTS.md).

We do not need 10,000 more lines of code. We need fewer, sharper ones in service
of these experiences.

---

## 9. The bet

Almost every AI product today is a smarter chat. They optimize for the model.

We are betting the opposite: that the winner optimizes for the **outcome** and
owns the **context**. That AI becomes a workforce you manage, not a tool you
operate. That the founder who can run companies from a sentence on their phone
will not go back.

If we hold these principles — outcome over AI, memory as the product, one
sentence to ship — RNZ OS stops being "another AI tool" and becomes the place
real work gets done.

That is the moment it is worth using for everything real — GOCO, ECUX, RNZ
Memory itself. Not to demo. To run the companies.

---

_When in doubt, re-read §5. Build for the outcome. Hide the machine. Remember
everything._
