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
