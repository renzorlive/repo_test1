import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Project repository — the only place that talks to Prisma for projects.
 * Repositories are intentionally thin: data access only, no business rules.
 */
export const projectRepository = {
  findManyByWorkspace(
    workspaceId: string,
    args?: { skip?: number; take?: number; search?: string },
  ) {
    const where: Prisma.ProjectWhereInput = {
      workspaceId,
      ...(args?.search
        ? { name: { contains: args.search, mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction([
      prisma.project.findMany({
        where,
        skip: args?.skip,
        take: args?.take,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { missions: true, tasks: true } } },
      }),
      prisma.project.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { missions: true, tasks: true } } },
    });
  },

  create(workspaceId: string, data: Prisma.ProjectCreateWithoutWorkspaceInput) {
    return prisma.project.create({
      data: { ...data, workspace: { connect: { id: workspaceId } } },
    });
  },

  update(id: string, data: Prisma.ProjectUpdateInput) {
    return prisma.project.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.project.delete({ where: { id } });
  },
};
