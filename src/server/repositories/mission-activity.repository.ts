import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const actorSelect = {
  actor: { select: { id: true, name: true, image: true } },
} satisfies Prisma.MissionActivityInclude;

export type ActivityWithActor = Prisma.MissionActivityGetPayload<{
  include: typeof actorSelect;
}>;

/**
 * Append-only activity store. Writes are single inserts (high volume, no
 * updates); reads are cursor-paginated for the timeline and the dashboard feed.
 */
export const missionActivityRepository = {
  create(data: Prisma.MissionActivityCreateInput) {
    return prisma.missionActivity.create({ data, include: actorSelect });
  },

  listByMission(missionId: string, args: { take: number; cursor?: string }) {
    return prisma.missionActivity.findMany({
      where: { missionId },
      orderBy: { createdAt: "desc" },
      take: args.take,
      ...(args.cursor ? { cursor: { id: args.cursor }, skip: 1 } : {}),
      include: actorSelect,
    });
  },

  /** Recent activity across an entire workspace (dashboard feed). */
  listByWorkspace(workspaceId: string, take: number) {
    return prisma.missionActivity.findMany({
      where: { mission: { workspaceId } },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        ...actorSelect,
        mission: { select: { id: true, title: true } },
      },
    });
  },
};
