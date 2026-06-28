/**
 * Seed script — creates a demo workspace, owner user, projects, missions and
 * agents so the app has realistic data on first run.
 *
 * Run with: `npm run db:seed`
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "demo@rnz.os" },
    update: {},
    create: {
      email: "demo@rnz.os",
      name: "Demo Founder",
      passwordHash,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: "rnz-hq" },
    update: {},
    create: {
      name: "RNZ HQ",
      slug: "rnz-hq",
      memberships: { create: { userId: user.id, role: "OWNER" } },
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

  await prisma.mission.create({
    data: {
      title: "Ship authentication & workspaces",
      summary: "Auth.js, multi-tenant workspaces and RBAC.",
      status: "ACTIVE",
      priority: "HIGH",
      progress: 72,
      projectId: project.id,
    },
  });

  await prisma.agent.create({
    data: {
      name: "Atlas",
      description: "Orchestrator that decomposes missions into epics and tasks.",
      type: "ORCHESTRATOR",
      status: "IDLE",
      workspaceId: workspace.id,
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
