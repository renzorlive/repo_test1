# RNZ OS — Execution Workspace

The product layer that turns the Mission Engine + AI Orchestrator into the
primary screen a founder uses. The feel is Linear + Cursor + GitHub Copilot —
not an admin dashboard.

## Mission Control (homepage)

`/command-center` is now **Mission Control**: today's progress, large
tappable mission cards (each with the single primary CTA **▶ Execute Mission**
and a Resume action), running executions, approvals, and this week's goals. One
service call (`missionControlService.get`) assembles it.

## The single primary CTA

Every Mission Workspace and Mission Control card surfaces one primary action:
**▶ Execute Mission**, which opens the full-screen Execution Wizard at
`/missions/[id]/execute` (the `(focus)` route group — no sidebar/top-nav).

## Execution Wizard (8 steps, full screen, no modal)

1. **Review Mission** — objective/summary/background + AI risks & gaps.
2. **Choose Goal** — preset (sets a capability) + editable instruction.
3. **Select AI Workers** — registry cards; capability-matched workers flagged
   "recommended".
4. **Review Generated Context** — the Context Builder's package (sections +
   token estimates), assembled with **no AI call** via
   `POST …/missions/:id/execution-preview`.
5. **Review Generated Prompt** — the versioned, hashed prompt messages.
6. **Launch** — recap + optional approval gate → `POST …/ai/executions`.
7. **Live Progress** — polled execution: state, worker, elapsed, live timeline,
   logs, generated files, cost, and the next suggested action.
8. **Approve / Retry / Continue** — contextual actions; on completion an
   **Execution Summary** is generated automatically (summary, files changed,
   tokens, cost, estimated remaining work) with "Run another" / "Back to
   mission".

> Until provider adapters exist, a clearly-labelled "Simulate worker result"
> action stands in for the external worker callback so the full
> run → completion → summary flow is demonstrable end to end.

## Milestone progress (not percentages)

The Mission Workspace Progress tab shows a milestone ladder — Planning,
Architecture, Implementation, Testing, Review, Deploy, Completed — derived from
status + progress. Each milestone expands into the slice of execution history
that happened during it.

## AI Suggestions

Every mission proactively suggests (heuristically, no model call —
`executionPlannerService.suggestions`): next task, next worker, potential
risks, missing context and possible improvements. Shown on the Mission
Workspace Overview and in wizard step 1.

## Mobile

A fixed bottom tab bar (`MobileNav`, `lg:hidden`) puts Mission Control,
Missions, Inbox, AI and Settings one tap away; the wizard is a mobile-first
full-screen flow with a compact stepper. Everything important is reachable in
≤ 3 taps.

## Architecture note

This layer adds **no new coupling**: the wizard's context/prompt preview reuses
the same provider-agnostic `contextBuilder` / `promptBuilder` the engine runs,
via the shared `gatherMissionContextSources`. All reads/writes still flow
Repository → Service → (Engine) → API → UI.
