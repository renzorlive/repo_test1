import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Agent repository — data access for AI agents, scoped via workspace. */
export const agentRepository = {
  findManyByWorkspace(
    workspaceId: string,
    args?: { skip?: number; take?: number; search?: string },
  ) {
    const where: Prisma.AgentWhereInput = {
      workspaceId,
      ...(args?.search
        ? { name: { contains: args.search, mode: "insensitive" } }
        : {}),
    };
    return prisma.$transaction([
      prisma.agent.findMany({
        where,
        skip: args?.skip,
        take: args?.take,
        orderBy: { updatedAt: "desc" },
        include: { _count: { select: { tasks: true, workflows: true } } },
      }),
      prisma.agent.count({ where }),
    ]);
  },

  findById(id: string) {
    return prisma.agent.findUnique({ where: { id } });
  },

  create(workspaceId: string, data: Prisma.AgentCreateWithoutWorkspaceInput) {
    return prisma.agent.create({
      data: { ...data, workspace: { connect: { id: workspaceId } } },
    });
  },

  update(id: string, data: Prisma.AgentUpdateInput) {
    return prisma.agent.update({ where: { id }, data });
  },

  remove(id: string) {
    return prisma.agent.delete({ where: { id } });
  },
};
