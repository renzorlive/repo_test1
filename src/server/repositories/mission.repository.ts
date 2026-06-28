import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Mission repository — data access for missions, scoped via project. */
export const missionRepository = {
  findManyByProject(
    projectId: string,
    args?: { skip?: number; take?: number; search?: string },
  ) {
    const where: Prisma.MissionWhereInput = {
      projectId,
      ...(args?.search
        ? { title: { contains: args.search, mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction([
      prisma.mission.findMany({
        where,
        skip: args?.skip,
        take: args?.take,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { epics: true } } },
      }),
      prisma.mission.count({ where }),
    ]);
  },

  findManyByWorkspace(workspaceId: string) {
    return prisma.mission.findMany({
      where: { project: { workspaceId } },
      orderBy: { updatedAt: "desc" },
      include: { project: { select: { id: true, name: true, key: true } } },
    });
  },

  findById(id: string) {
    return prisma.mission.findUnique({
      where: { id },
      include: { epics: true, project: true },
    });
  },

  create(data: Prisma.MissionCreateInput) {
    return prisma.mission.create({ data });
  },

  update(id: string, data: Prisma.MissionUpdateInput) {
    return prisma.mission.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.mission.delete({ where: { id } });
  },
};
