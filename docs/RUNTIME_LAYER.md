# RNZ OS — Runtime Layer

The first step toward a **distributed AI operating system**. RNZ OS now executes
real work by treating runtimes — Claude Code first — as **remote workers on
other machines**, not as API integrations.

```
Mission → Execution Plan → Runtime → Claude Code Worker → Execution Events → Mission Timeline
```

## The cardinal rule

The Runtime Layer is **mission-agnostic**. A runtime only ever runs generic
jobs (`RuntimeCommand`) and streams back logs, artifacts, heartbeats and an exit
code. The *only* link to the rest of RNZ OS is the optional `aiExecutionId` on
`RuntimeExecution` — set by the orchestrator, never read by a runtime adapter.

## Abstractions (built first; Claude Code is Runtime #1)

| Entity              | Role                                                        |
| ------------------- | ---------------------------------------------------------- |
| `RuntimeHost`       | A machine (hostname, OS, CPU, memory, GPU, status, agent). |
| `Runtime`           | A worker registered on a host (type, version, capacity).   |
| `RuntimeCapability` | What a runtime can do (shell, fs, git, code exec…).        |
| `RuntimeSession`    | A token-authenticated connection to a remote agent.        |
| `RuntimeCommand`    | A generic job spec (command, args, cwd, env, prompt).      |
| `RuntimeExecution`  | A job run (status machine + timestamps + exit code).       |
| `RuntimeHeartbeat`  | Liveness + CPU/RAM pings (host- or job-level).             |
| `RuntimeArtifact`   | A detected file change (created/modified/deleted).         |
| `RuntimeLog`        | A streamed stdout/stderr/system line.                      |
| `RuntimeTerminal`   | The live terminal attached to an execution.                |

Future runtimes — **Codex CLI, Gemini CLI, Cursor CLI, local agents, Docker,
SSH** — implement the same `RuntimeAdapter` interface and register one line in
`server/runtime/adapters/index.ts`. No engine changes.

## How a remote worker connects

1. A user registers a machine (`POST …/runtime/hosts`) → RNZ OS mints a
   one-time **session token**.
2. The `rnz-agent` process on the machine connects with that token
   (`POST /api/runtime/agent/connect`) and reports its real specs → host goes
   ONLINE. These agent routes are **excluded from user auth** (see
   `middleware.ts`); they authenticate by `x-runtime-token`.
3. The agent polls `POST /api/runtime/agent/claim` for jobs, runs Claude Code,
   and streams back via `POST /api/runtime/agent/report`
   (logs / artifacts / heartbeat / completion).

## Execution state machine (generic)

```
PENDING → DISPATCHED → RUNNING → SUCCEEDED | FAILED | CANCELLED | TIMED_OUT
```

The Claude Code adapter only handles **dispatch** and **cancel**; the engine
never blocks on a vendor. Cancellation is cooperative — the agent observes
`cancelRequested` on its next heartbeat. Retry re-opens the terminal and
re-dispatches.

## The bridge (orchestration glue)

`runtimeBridgeService` is the only place that knows about both worlds:

- `dispatchAiExecution` builds a generic job from an AI execution's prompt and
  sends it to a host — the runtime never sees the mission.
- `onRuntimeFinished` (called by the agent service on completion) stores
  detected files as **mission artifacts**, rolls the result into the AI
  execution, and writes a **mission timeline** event.

## UI

- **Machines** (`/machines`) — the Host Dashboard: connected machines (specs,
  health, last seen), fleet KPIs (online, runtimes, running, queued), current
  jobs, and one-click **Connect a machine** (reveals the agent token + command).
- **Live Terminal** (`/machines/executions/[id]`) — streams stdout/stderr/
  system lines with timestamps, status, exit code and live execution time;
  auto-scrolls; cancel/retry inline.
- **Run on machine** — on an AI execution, pick a host and jump straight to the
  live terminal.

## The mobile story (now real)

Open RNZ OS on your phone → **Machines** tab shows your home PC online →
open a mission → **▶ Execute Mission** → **Run on machine** → watch Claude Code
work live in the terminal → **Approve** the result. All in ≤ 3 taps; "Machines"
is in the bottom tab bar.
