# RNZ OS — Sprint 3 proposal

**Theme:** "The orchestrator goes live and durable."

Sprint 3 delivered the **AI Orchestrator**: a provider-agnostic execution
platform — registry (providers/models/workers/capabilities/queues), a generic
execution state machine, the Context Builder and Prompt Builder, cost/usage
accounting, the AI Inbox and the orchestrator dashboard. No vendor SDK is
referenced anywhere; everything routes through the provider adapter interface.

This document records what landed and proposes the next sprint.

---

## ✅ Delivered this sprint

- **Schema + migration** — 13 models (AiProvider, AiModel, AiWorker,
  AiCapability, AiQueue, AiExecution, AiPrompt, AiResult, AiCost, AiUsage,
  AiExecutionEvent, AiExecutionLog, AiExecutionArtifact) + 8 enums. Delta
  migration generated offline.
- **Execution Engine** — `QUEUED → PREPARING → BUILDING_CONTEXT → RUNNING →
  (WAITING_APPROVAL) → COMPLETED/FAILED/CANCELLED/RETRYING`, with a timestamp
  and event persisted on every transition.
- **Context Builder & Prompt Builder** — pure, deterministic, versioned +
  hashed; full context package persisted per prompt for reproducibility.
- **Worker Registry + scheduler** — capability/health/priority/concurrency
  selection.
- **Provider Adapter Interface + registry** — the seam for OpenAI, Anthropic,
  Gemini, Ollama, OpenRouter and local models. No implementations (by design).
- **AI Inbox** (6 lanes) and **Orchestrator Dashboard** (running workers,
  queued jobs, success rate, avg runtime, daily cost, top providers/workers,
  execution timeline) + execution detail view.

---

## 🎯 Sprint 4 (next) — proposed scope

**Goal:** make executions *actually run* behind the interface, durably and
at scale — without ever coupling business logic to a vendor.

### 1. First provider adapters (Day 1–5)

- [ ] Implement `OpenAiAdapter` and `AnthropicAdapter` against
      `AiProviderAdapter` in a separate `packages/ai-providers` (no engine
      changes). Register them at startup.
- [ ] Secret management: provider credentials via env/secret store, referenced
      by `AiProvider.config` (never persisted in plaintext).
- [ ] Real tokenizers replace `estimateTokens` per provider.

### 2. Durable queue + workers (Day 3–8)

- [ ] Activate BullMQ: an `ai-execution` queue; the engine enqueues at
      `RUNNING` instead of parking, a worker process drains it and calls the
      adapter, then reports via `complete()` / `fail()`.
- [ ] Respect `AiQueue.concurrency` and worker `concurrency` as queue limits.
- [ ] Exponential-backoff retries driven by `maxRetries`; dead-letter on
      exhaustion.
- [ ] Heartbeats update worker `health` / `lastSeenAt`; stale workers auto-drain.

### 3. Live execution view (Day 6–9)

- [ ] SSE stream of `AiExecutionEvent`s; live-update the execution timeline,
      inbox and dashboard (reuse the mission-events subscription pattern).
- [ ] Streaming token output into `AiResult` as it arrives.

### 4. Cost governance (Day 8–10)

- [ ] Per-workspace + per-mission budgets; block/queue when exceeded.
- [ ] Daily cost trend + per-provider/per-model breakdowns on the dashboard.
- [ ] Alerting on high-cost / low-confidence executions from the inbox.

### 5. Quality & hardening (ongoing)

- [ ] Vitest: engine transitions, `workerRegistry.select`, `contextBuilder`,
      `promptBuilder` hashing, cross-tenant rejection.
- [ ] Playwright: submit → waiting approval → approve → complete.
- [ ] Load test the scheduler at thousands of executions/day.
- [ ] CI: typecheck + lint + build + `prisma validate` + tests.

---

## Out of scope (later)

- Multi-step workflows / agent graphs over executions (DAG runner).
- Fine-tuning / embeddings pipelines.
- Marketplace of community worker templates.

## Key risks

- **Vendor coupling creep** → enforce the rule in review: nothing under
  `server/**` imports a provider SDK; only `packages/ai-providers` may.
- **Scheduler fairness** under load → add queue-level fairness + backpressure;
  the `findCandidates` load query must stay indexed.
- **Cost accuracy** → swap heuristic tokens for real tokenizers before billing
  decisions depend on `AiCost`.
