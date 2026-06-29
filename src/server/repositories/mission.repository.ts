import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Fields selected when a mission is shown in a list/card. */
const listSelect = {
  id: true,
  title: true,
  summary: true,
  status: true,
  health: true,
  priority: true,
  progress: true,
  dueDate: true,
  updatedAt: true,
  owner: { select: { id: true, name: true, image: true } },
  project: { select: { id: true, name: true, key: true, color: true } },
  _count: {
    select: { tasks: true, epics: true, approvals: true, aiSessions: true },
  },
} satisfies Prisma.MissionSelect;

/** Deep include used by the Mission Workspace aggregate read. */
const aggregateInclude = {
  owner: { select: { id: true, name: true, email: true, image: true } },
  project: { select: { id: true, name: true, key: true, color: true } },
  context: true,
  milestones: { orderBy: { position: "asc" } },
  epics: {
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { tasks: true } } },
  },
  tasks: {
    orderBy: [{ status: "asc" }, { position: "asc" }],
    include: { assignee: { select: { id: true, name: true, image: true } } },
  },
  decisions: { orderBy: { createdAt: "desc" } },
  artifacts: { orderBy: { createdAt: "desc" } },
  approvals: {
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
      requestedBy: { select: { id: true, name: true, image: true } },
    },
  },
  metrics: { orderBy: { recordedAt: "desc" }, take: 100 },
  notes: {
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { id: true, name: true, image: true } } },
  },
  aiSessions: {
    orderBy: { createdAt: "desc" },
    include: { agent: { select: { id: true, name: true, type: true } } },
  },
  executions: { orderBy: { createdAt: "desc" }, take: 20 },
  dependencies: {
    include: {
      dependsOn: { select: { id: true, title: true, status: true, health: true } },
    },
  },
  dependents: {
    include: {
      mission: { select: { id: true, title: true, status: true, health: true } },
    },
  },
  activities: {
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { id: true, name: true, image: true } } },
  },
} satisfies Prisma.MissionInclude;

export type MissionAggregate = Prisma.MissionGetPayload<{
  include: typeof aggregateInclude;
}>;

export type MissionListItem = Prisma.MissionGetPayload<{
  select: typeof listSelect;
}>;

/**
 * Mission repository — the data-access surface for the central domain object.
 * No business rules here: callers in the service layer enforce authorization
 * and orchestration.
 */
export const missionRepository = {
  /** Lightweight fetch for authorization/ownership guards. */
  findCore(id: string) {
    return prisma.mission.findUnique({ where: { id } });
  },

  /** Full aggregate for the Mission Workspace. */
  findAggregate(id: string): Promise<MissionAggregate | null> {
    return prisma.mission.findUnique({ where: { id }, include: aggregateInclude });
  },

  findManyByWorkspace(
    workspaceId: string,
    args?: { skip?: number; take?: number; search?: string },
  ) {
    const where: Prisma.MissionWhereInput = {
      workspaceId,
      ...(args?.search
        ? { title: { contains: args.search, mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction([
      prisma.mission.findMany({
        where,
        skip: args?.skip,
        take: args?.take,
        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
        select: listSelect,
      }),
      prisma.mission.count({ where }),
    ]);
  },

  findManyByProject(projectId: string) {
    return prisma.mission.findMany({
      where: { projectId },
      orderBy: { updatedAt: "desc" },
      select: listSelect,
    });
  },

  create(data: Prisma.MissionCreateInput) {
    return prisma.mission.create({ data, select: listSelect });
  },

  update(id: string, data: Prisma.MissionUpdateInput) {
    return prisma.mission.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.mission.delete({ where: { id } });
  },

  /** Task counts grouped by completion, used to recompute progress. */
  async taskRollup(missionId: string) {
    const [total, done] = await prisma.$transaction([
      prisma.task.count({ where: { missionId } }),
      prisma.task.count({ where: { missionId, status: "DONE" } }),
    ]);
    return { total, done };
  },

  upsertContext(missionId: string, data: Prisma.MissionContextUpdateInput) {
    return prisma.missionContext.upsert({
      where: { missionId },
      update: data,
      create: {
        mission: { connect: { id: missionId } },
        background:
          typeof data.background === "string" ? data.background : undefined,
        constraints: (data.constraints as Prisma.InputJsonValue) ?? [],
        assumptions: (data.assumptions as Prisma.InputJsonValue) ?? [],
        references: (data.references as Prisma.InputJsonValue) ?? [],
      },
    });
  },

  createMilestone(data: Prisma.MissionTimelineCreateInput) {
    return prisma.missionTimeline.create({ data });
  },

  createArtifact(data: Prisma.ArtifactCreateInput) {
    return prisma.artifact.create({ data });
  },

  nextMilestonePosition(missionId: string) {
    return prisma.missionTimeline.count({ where: { missionId } });
  },
};
