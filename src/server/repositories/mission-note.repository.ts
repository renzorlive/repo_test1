import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const include = {
  author: { select: { id: true, name: true, image: true } },
} satisfies Prisma.MissionNoteInclude;

export const missionNoteRepository = {
  listByMission(missionId: string) {
    return prisma.missionNote.findMany({
      where: { missionId },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      include,
    });
  },

  create(data: Prisma.MissionNoteCreateInput) {
    return prisma.missionNote.create({ data, include });
  },
};
