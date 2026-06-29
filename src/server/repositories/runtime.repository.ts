import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const IN_FLIGHT: Prisma.RuntimeExecutionWhereInput["status"] = {
  in: ["DISPATCHED", "RUNNING"],
};

export const runtimeRepository = {
  findById(id: string) {
    return prisma.runtime.findUnique({
      where: { id },
      include: { host: true, capabilities: true },
    });
  },

  updateStatus(id: string, data: Prisma.RuntimeUpdateInput) {
    return prisma.runtime.update({ where: { id }, data });
  },

  /**
   * Find a dispatchable runtime on a host: connected session, not draining,
   * with a free concurrency slot. Returns the runtime + its live session.
   */
  async findDispatchTarget(hostId: string) {
    const runtimes = await prisma.runtime.findMany({
      where: {
        hostId,
        status: { in: ["ONLINE", "BUSY"] },
        sessions: { some: { status: "CONNECTED" } },
      },
      include: {
        sessions: {
          where: { status: "CONNECTED" },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });

    for (const runtime of runtimes) {
      const inFlight = await prisma.runtimeExecution.count({
        where: { runtimeId: runtime.id, status: IN_FLIGHT },
      });
      if (inFlight < runtime.maxConcurrency && runtime.sessions[0]) {
        return { runtime, session: runtime.sessions[0] };
      }
    }
    return null;
  },
};
