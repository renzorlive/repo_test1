# Naming — what do we call a "Mission"?

> A CEO does not say "I have 14 missions." This is a decision for Andrei to
> make by feel, not for the system to make unilaterally. Below is the
> exploration and a way to decide. Nothing is renamed in code yet.

## The tension

"Mission" is good _internally_ (it's an autonomous manager that owns work). But
to the founder, the object is a **business objective**, and the word should
sound like one — not like a technical task.

## Candidates

| Term           | Founder sentence                  | Feels like        | Risk                                   |
| -------------- | --------------------------------- | ----------------- | -------------------------------------- |
| **Mission**    | "I have 14 missions."             | Ops / military    | Slightly technical; internal-sounding  |
| **Initiative** | "I have 14 initiatives."          | Corporate / exec  | A bit heavy / consultant-y             |
| **Launch**     | "I have 14 launches."             | Momentum / ship   | Too narrow — not all work is a launch  |
| **Outcome**    | "I have 14 outcomes in progress." | Outcome-first ✓   | Awkward grammar mid-flight             |
| **Build**      | "I have 14 builds running."       | Maker / shipping  | Collides with CI "builds"              |

## A reading

- **Outcome** aligns perfectly with the manifesto (_outcome over AI_) and is the
  most differentiated, but reads awkwardly while work is _in progress_ ("an
  outcome in progress" is a contradiction in tense).
- **Launch** has the best energy and matches the hero ("Launch GOCO"), but not
  every objective is a launch (some are fixes, migrations, campaigns).
- **Initiative** is the most accurate executive word but the least exciting.
- **Mission** is fine and already coherent with "Mission Brain / Mission
  Control" — a real asset we'd lose by renaming.

A possible split worth testing: keep **Mission** as the internal/engine concept
(Mission Brain, Mission Control) and let the **verb** the founder uses be
**"Launch"** — the noun stays Mission, the action is Launch. The user mostly
_does_ ("Launch GOCO"), rarely _counts_ ("I have 14 …").

## How to decide (don't theorize — feel it)

Say each out loud, in your own voice, for your real companies:

> "I have 14 ____ in progress across GOCO, ECUX and RNZ Memory."
> "____ : Launch GOCO Marketplace."
> "Continue the GOCO ____."

Pick the one that doesn't make you wince. Whichever wins, the rename is a
**label-layer change** (UI strings + a couple of types), cheap to do once —
because the architecture is the same object underneath.

## Recommendation

Don't rename yet. Decide _after_ Milestone Alpha, when you're using it on real
work — the right word becomes obvious when you're living in it daily. Until
then: keep **Mission** in the engine, lean on the verb **"Launch"** in the UI.
