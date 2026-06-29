/**
 * Seed script — provisions a realistic workspace centered on the Mission
 * Engine: missions with context, milestones, tasks, approvals, AI sessions,
 * metrics, notes, a dependency and a populated activity timeline.
 *
 * Run with: `npm run db:seed`
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000);

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@rnz.os" },
    update: {},
    create: { email: "demo@rnz.os", name: "Demo Founder", passwordHash },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: "lead@rnz.os" },
    update: {},
    create: { email: "lead@rnz.os", name: "Tech Lead", passwordHash },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "rnz-hq" },
    update: {},
    create: {
      name: "RNZ HQ",
      slug: "rnz-hq",
      memberships: {
        create: [
          { userId: user.id, role: "OWNER" },
          { userId: reviewer.id, role: "ADMIN" },
        ],
      },
    },
  });

  const project = await prisma.project.upsert({
    where: { workspaceId_key: { workspaceId: workspace.id, key: "RNZ" } },
    update: {},
    create: {
      name: "RNZ OS Core Platform",
      key: "RNZ",
      description: "Foundation, execution engine and workspace orchestration.",
      status: "ACTIVE",
      color: "#6366f1",
      workspaceId: workspace.id,
    },
  });

  const orchestrator = await prisma.agent.create({
    data: {
      name: "Atlas",
      description: "Orchestrator that decomposes missions into epics and tasks.",
      type: "ORCHESTRATOR",
      status: "IDLE",
      workspaceId: workspace.id,
    },
  });

  // ---- Primary mission: full execution surface -----------------------------
  const mission = await prisma.mission.create({
    data: {
      title: "Ship the Mission Engine",
      summary: "Make the mission the central execution domain of RNZ OS.",
      objective:
        "Every entity in the platform revolves around a mission with a live timeline, approvals and cost accounting.",
      status: "ACTIVE",
      health: "ON_TRACK",
      priority: "URGENT",
      progress: 55,
      startedAt: daysFromNow(-9),
      dueDate: daysFromNow(6),
      estimatedHours: 120,
      actualHours: 68,
      estimatedCost: 18000,
      actualCost: 9400,
      workspaceId: workspace.id,
      projectId: project.id,
      ownerId: user.id,
      context: {
        create: {
          background:
            "The foundation shipped in Sprint 1. Sprint 2 turns the mission into the source of truth.",
          constraints: ["No AI integrations yet", "Strict layered architecture"],
          assumptions: ["Postgres + Redis available", "Single workspace for demo"],
          references: [
            { label: "Architecture", url: "https://rnz.os/docs/architecture" },
          ],
        },
      },
      milestones: {
        create: [
          { title: "Schema + migration", status: "DONE", position: 0, endsAt: daysFromNow(-6) },
          { title: "Service + API layer", status: "ACTIVE", position: 1 },
          { title: "Mission Workspace UI", status: "ACTIVE", position: 2 },
          { title: "Dashboard rollups", status: "PLANNED", position: 3, startsAt: daysFromNow(2) },
        ],
      },
      metrics: {
        create: [
          { key: "velocity", label: "Velocity", value: 23, unit: "pts" },
          { key: "cost_burn", label: "Cost burn", value: 9400, unit: "$", target: 18000 },
          { key: "ai_spend", label: "AI spend", value: 142.5, unit: "$" },
        ],
      },
      notes: {
        create: [
          { body: "Denormalized workspaceId onto Mission for dashboard speed.", pinned: true, authorId: user.id },
          { body: "Approvals gate the COMPLETED transition in Sprint 3.", authorId: reviewer.id },
        ],
      },
    },
  });

  // Epics + tasks (drive the progress rollup)
  const epic = await prisma.epic.create({
    data: {
      title: "Backend execution layer",
      status: "IN_PROGRESS",
      projectId: project.id,
      missionId: mission.id,
    },
  });

  await prisma.task.createMany({
    data: [
      { title: "Extend Prisma schema", status: "DONE", priority: "HIGH", projectId: project.id, missionId: mission.id, epicId: epic.id, assigneeId: user.id },
      { title: "MissionService + events", status: "DONE", priority: "HIGH", projectId: project.id, missionId: mission.id, epicId: epic.id, assigneeId: user.id },
      { title: "Approval system", status: "IN_PROGRESS", priority: "URGENT", projectId: project.id, missionId: mission.id, epicId: epic.id },
      { title: "Mission Workspace UI", status: "IN_PROGRESS", priority: "HIGH", projectId: project.id, missionId: mission.id },
      { title: "Dashboard rollups", status: "TODO", priority: "MEDIUM", projectId: project.id, missionId: mission.id },
    ],
  });

  await prisma.decision.create({
    data: {
      title: "Denormalize workspaceId onto Mission",
      context: "Dashboard queries should not join through projects at scale.",
      outcome: "Store workspaceId on Mission, set from the parent project.",
      status: "ACCEPTED",
      projectId: project.id,
      missionId: mission.id,
      authorId: user.id,
    },
  });

  await prisma.artifact.create({
    data: {
      name: "Mission Engine — Architecture",
      type: "DOCUMENT",
      projectId: project.id,
      missionId: mission.id,
      content: { format: "markdown" },
    },
  });

  const approval = await prisma.missionApproval.create({
    data: {
      missionId: mission.id,
      title: "Approve Mission Engine data model",
      description: "Sign-off on the schema before generating the migration.",
      status: "PENDING",
      requestedById: user.id,
      reviewerId: reviewer.id,
    },
  });

  const session = await prisma.aiSession.create({
    data: {
      missionId: mission.id,
      agentId: orchestrator.id,
      title: "Decompose Mission Engine into epics",
      status: "COMPLETED",
      model: "claude-opus-4-8",
      summary: "Produced an epic + 5 tasks for the backend layer.",
      inputTokens: 18240,
      outputTokens: 5120,
      cost: 1.42,
      startedAt: daysFromNow(-8),
      completedAt: daysFromNow(-8),
    },
  });

  // ---- Secondary mission (dependency target) -------------------------------
  const upstream = await prisma.mission.create({
    data: {
      title: "Harden authentication & RBAC",
      summary: "Role-based authorization across all services.",
      objective: "Ship OWNER/ADMIN/MEMBER/VIEWER enforcement end to end.",
      status: "BLOCKED",
      health: "AT_RISK",
      priority: "HIGH",
      progress: 30,
      startedAt: daysFromNow(-14),
      dueDate: daysFromNow(3),
      workspaceId: workspace.id,
      projectId: project.id,
      ownerId: reviewer.id,
    },
  });

  await prisma.missionDependency.create({
    data: { missionId: mission.id, dependsOnId: upstream.id, type: "RELATES_TO" },
  });

  // ---- Activity timeline (seed a believable history) -----------------------
  await prisma.missionActivity.createMany({
    data: [
      { missionId: mission.id, type: "MISSION_CREATED", title: 'Mission "Ship the Mission Engine" created', actorType: "USER", actorId: user.id, actorName: user.name },
      { missionId: mission.id, type: "AI_SESSION_STARTED", title: 'AI session "Decompose Mission Engine" started', actorType: "AGENT", actorName: "Atlas", metadata: { sessionId: session.id } },
      { missionId: mission.id, type: "AI_SESSION_COMPLETED", title: "AI session completed", actorType: "AGENT", actorName: "Atlas", metadata: { sessionId: session.id, cost: 1.42 } },
      { missionId: mission.id, type: "TASK_COMPLETED", title: 'Task "Extend Prisma schema" completed', actorType: "USER", actorId: user.id, actorName: user.name },
      { missionId: mission.id, type: "DECISION_ADDED", title: "Decision: Denormalize workspaceId onto Mission", actorType: "USER", actorId: user.id, actorName: user.name },
      { missionId: mission.id, type: "APPROVAL_REQUESTED", title: 'Approval requested: "Approve Mission Engine data model"', actorType: "USER", actorId: user.id, actorName: user.name, metadata: { approvalId: approval.id } },
    ],
  });

  // ---- AI Orchestrator -----------------------------------------------------
  const anthropic = await prisma.aiProvider.create({
    data: { workspaceId: workspace.id, name: "Anthropic", type: "ANTHROPIC" },
  });
  const openai = await prisma.aiProvider.create({
    data: { workspaceId: workspace.id, name: "OpenAI", type: "OPENAI" },
  });

  const opus = await prisma.aiModel.create({
    data: {
      providerId: anthropic.id,
      name: "claude-opus-4-8",
      label: "Claude Opus 4.8",
      contextWindow: 200000,
      maxOutputTokens: 16000,
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
    },
  });
  const gpt4o = await prisma.aiModel.create({
    data: {
      providerId: openai.id,
      name: "gpt-4o",
      label: "GPT-4o",
      contextWindow: 128000,
      maxOutputTokens: 16000,
      inputCostPer1k: 0.005,
      outputCostPer1k: 0.015,
    },
  });

  const capabilityKinds = [
    "TEXT_GENERATION",
    "CODE_GENERATION",
    "REASONING",
    "WEB_SEARCH",
    "SUMMARIZATION",
  ] as const;
  const caps: Record<string, { id: string }> = {};
  for (const kind of capabilityKinds) {
    caps[kind] = await prisma.aiCapability.create({
      data: {
        workspaceId: workspace.id,
        kind,
        name: kind
          .toLowerCase()
          .split("_")
          .map((w) => w[0]!.toUpperCase() + w.slice(1))
          .join(" "),
      },
    });
  }

  const forge = await prisma.aiWorker.create({
    data: {
      workspaceId: workspace.id,
      providerId: anthropic.id,
      modelId: opus.id,
      name: "Forge",
      role: "Engineer",
      description: "Code generation and review worker.",
      status: "ACTIVE",
      health: "HEALTHY",
      contextWindow: 200000,
      maxTokens: 16000,
      inputCostPer1k: 0.015,
      outputCostPer1k: 0.075,
      priority: 80,
      concurrency: 2,
      lastSeenAt: new Date(),
      capabilities: { connect: [{ id: caps.CODE_GENERATION!.id }, { id: caps.REASONING!.id }] },
    },
  });
  const scout = await prisma.aiWorker.create({
    data: {
      workspaceId: workspace.id,
      providerId: openai.id,
      modelId: gpt4o.id,
      name: "Scout",
      role: "Researcher",
      status: "IDLE",
      health: "HEALTHY",
      contextWindow: 128000,
      maxTokens: 16000,
      inputCostPer1k: 0.005,
      outputCostPer1k: 0.015,
      priority: 60,
      concurrency: 3,
      lastSeenAt: new Date(),
      capabilities: { connect: [{ id: caps.TEXT_GENERATION!.id }, { id: caps.WEB_SEARCH!.id }] },
    },
  });

  const queue = await prisma.aiQueue.create({
    data: { workspaceId: workspace.id, name: "default", concurrency: 4, priority: 50 },
  });

  // A completed execution with full accounting + timeline.
  const completedAiExecution = await prisma.aiExecution.create({
    data: {
      workspaceId: workspace.id,
      title: "Generate Prisma schema for Mission Engine",
      state: "COMPLETED",
      priority: 70,
      attempt: 1,
      maxAttempts: 3,
      confidence: 0.92,
      input: { userRequest: "Design the Mission Engine schema", requiredCapability: "CODE_GENERATION" },
      missionId: mission.id,
      projectId: project.id,
      workerId: forge.id,
      queueId: queue.id,
      requestedById: user.id,
      runningAt: daysFromNow(-7),
      completedAt: daysFromNow(-7),
      prompts: {
        create: {
          version: 1,
          systemInstructions: "You are an AI worker operating inside RNZ OS...",
          userRequest: "Design the Mission Engine schema",
          messages: [{ role: "system", content: "..." }],
          contextPackage: { sections: 4 },
          tokensEstimated: 4200,
          hash: "seedhash000000000000000000000001",
        },
      },
      result: { create: { content: "Generated 9 models and 8 enums.", confidence: 0.92, model: "claude-opus-4-8" } },
      usage: { create: { workspaceId: workspace.id, inputTokens: 4200, outputTokens: 1800, totalTokens: 6000, latencyMs: 8200 } },
      cost: { create: { workspaceId: workspace.id, inputCost: 0.063, outputCost: 0.135, totalCost: 0.198 } },
      events: {
        create: [
          { type: "QUEUED", message: "Execution queued" },
          { type: "STARTED", message: "Execution started" },
          { type: "PROVIDER_SELECTED", message: 'Worker "Forge" selected' },
          { type: "CONTEXT_READY", message: "Context assembled" },
          { type: "PROMPT_GENERATED", message: "Prompt v1 generated" },
          { type: "RUNNING", message: "Execution running" },
          { type: "COMPLETED", message: "Execution completed" },
        ],
      },
    },
  });

  // A high-cost completed execution (inbox warning).
  await prisma.aiExecution.create({
    data: {
      workspaceId: workspace.id,
      title: "Full architecture review",
      state: "COMPLETED",
      confidence: 0.41,
      input: { userRequest: "Review the whole architecture", requiredCapability: "REASONING" },
      missionId: mission.id,
      workerId: forge.id,
      requestedById: user.id,
      completedAt: new Date(),
      result: { create: { content: "Architecture review complete.", confidence: 0.41 } },
      usage: { create: { workspaceId: workspace.id, inputTokens: 60000, outputTokens: 12000, totalTokens: 72000, latencyMs: 31000 } },
      cost: { create: { workspaceId: workspace.id, inputCost: 0.9, outputCost: 0.9, totalCost: 1.8 } },
      events: { create: [{ type: "COMPLETED", message: "Execution completed" }] },
    },
  });

  // Waiting approval.
  await prisma.aiExecution.create({
    data: {
      workspaceId: workspace.id,
      title: "Refactor authentication module",
      state: "WAITING_APPROVAL",
      requiresApproval: true,
      input: { userRequest: "Refactor auth", requiredCapability: "CODE_GENERATION" },
      missionId: mission.id,
      workerId: forge.id,
      requestedById: user.id,
      waitingApprovalAt: new Date(),
      events: { create: [{ type: "WAITING_APPROVAL", message: "Awaiting human approval" }] },
    },
  });

  // Failed with retry budget.
  await prisma.aiExecution.create({
    data: {
      workspaceId: workspace.id,
      title: "Summarize competitor research",
      state: "FAILED",
      attempt: 2,
      maxAttempts: 3,
      error: "Provider timeout after 60000ms",
      input: { userRequest: "Summarize research", requiredCapability: "SUMMARIZATION" },
      workerId: scout.id,
      requestedById: user.id,
      failedAt: new Date(),
      events: { create: [{ type: "FAILED", message: "Execution failed" }] },
    },
  });

  // Queued.
  await prisma.aiExecution.create({
    data: {
      workspaceId: workspace.id,
      title: "Draft launch announcement",
      state: "QUEUED",
      input: { userRequest: "Draft announcement", requiredCapability: "TEXT_GENERATION" },
      queueId: queue.id,
      requestedById: user.id,
      events: { create: [{ type: "QUEUED", message: "Execution queued" }] },
    },
  });

  // ---- Runtime Layer -------------------------------------------------------
  const host = await prisma.runtimeHost.create({
    data: {
      workspaceId: workspace.id,
      name: "Andrei's MacBook Pro",
      hostname: "andrei-mbp.local",
      os: "macOS 15.1",
      arch: "arm64",
      cpuCores: 12,
      cpuModel: "Apple M3 Pro",
      memoryMb: 36864,
      gpu: "Apple M3 Pro GPU",
      status: "ONLINE",
      agentVersion: "0.4.0",
      lastSeenAt: new Date(),
    },
  });

  const runtimeCapKinds = ["SHELL", "FILE_SYSTEM", "GIT", "CODE_EXECUTION"] as const;
  const runtimeCaps: Record<string, { id: string }> = {};
  for (const kind of runtimeCapKinds) {
    runtimeCaps[kind] = await prisma.runtimeCapability.create({
      data: {
        workspaceId: workspace.id,
        kind,
        name: kind
          .toLowerCase()
          .split("_")
          .map((w) => w[0]!.toUpperCase() + w.slice(1))
          .join(" "),
      },
    });
  }

  const runtime = await prisma.runtime.create({
    data: {
      workspaceId: workspace.id,
      hostId: host.id,
      type: "CLAUDE_CODE",
      name: "Claude Code @ Andrei's MacBook Pro",
      version: "claude-code 1.0",
      status: "ONLINE",
      maxConcurrency: 2,
      capabilities: { connect: runtimeCapKinds.map((k) => ({ id: runtimeCaps[k]!.id })) },
    },
  });

  const runtimeSession = await prisma.runtimeSession.create({
    data: {
      runtimeId: runtime.id,
      hostId: host.id,
      token: `rnz_demo_${Date.now().toString(36)}`,
      status: "CONNECTED",
      lastHeartbeatAt: new Date(),
    },
  });

  // A finished Claude Code job, bridged to the completed AI execution.
  await prisma.runtimeExecution.create({
    data: {
      workspace: { connect: { id: workspace.id } },
      runtime: { connect: { id: runtime.id } },
      host: { connect: { id: host.id } },
      session: { connect: { id: runtimeSession.id } },
      aiExecution: { connect: { id: completedAiExecution.id } },
      status: "SUCCEEDED",
      exitCode: 0,
      dispatchedAt: daysFromNow(-7),
      startedAt: daysFromNow(-7),
      finishedAt: daysFromNow(-7),
      command: {
        create: {
          workspace: { connect: { id: workspace.id } },
          name: "Implement Mission Engine schema",
          command: "claude",
          args: ["-p"],
          prompt: "Design and implement the Mission Engine Prisma schema.",
          timeoutMs: 600000,
        },
      },
      terminal: { create: { status: "CLOSED", exitCode: 0, closedAt: daysFromNow(-7) } },
      logs: {
        create: [
          { sequence: 0, stream: "SYSTEM", content: "Job dispatched to Claude Code. Awaiting agent." },
          { sequence: 1, stream: "SYSTEM", content: 'Agent claimed job — execution started.' },
          { sequence: 2, stream: "STDOUT", content: "Reading mission context…" },
          { sequence: 3, stream: "STDOUT", content: "Editing prisma/schema.prisma" },
          { sequence: 4, stream: "STDOUT", content: "Adding 9 models and 8 enums" },
          { sequence: 5, stream: "STDERR", content: "warn: prisma format reordered relations" },
          { sequence: 6, stream: "SYSTEM", content: "Detected 2 artifact change(s)." },
          { sequence: 7, stream: "SYSTEM", content: "Process exited with code 0." },
        ],
      },
      artifacts: {
        create: [
          { path: "prisma/schema.prisma", change: "MODIFIED", kind: "FILE", sizeBytes: 18240 },
          { path: "prisma/migrations/20260628_mission/migration.sql", change: "CREATED", kind: "FILE", sizeBytes: 9120 },
        ],
      },
    },
  });

  console.log("✅ Seed complete. Login: demo@rnz.os / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
