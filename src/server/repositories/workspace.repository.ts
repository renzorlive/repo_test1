import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Workspace repository — tenancy + membership lookups. */
export const workspaceRepository = {
  findManyForUser(userId: string) {
    return prisma.workspace.findMany({
      where: { memberships: { some: { userId } } },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { projects: true, memberships: true } } },
    });
  },

  findBySlug(slug: string) {
    return prisma.workspace.findUnique({ where: { slug } });
  },

  findById(id: string) {
    return prisma.workspace.findUnique({ where: { id } });
  },

  /** Membership of a user within a workspace, or null. */
  findMembership(userId: string, workspaceId: string) {
    return prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
    });
  },

  /** Create a workspace and its owner membership atomically. */
  createWithOwner(
    userId: string,
    data: Prisma.WorkspaceCreateWithoutMembershipsInput,
  ) {
    return prisma.workspace.create({
      data: {
        ...data,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
  },

  update(id: string, data: Prisma.WorkspaceUpdateInput) {
    return prisma.workspace.update({ where: { id }, data });
  },
};
