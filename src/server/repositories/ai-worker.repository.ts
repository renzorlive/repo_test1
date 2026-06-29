import { prisma } from "@/lib/prisma";
import type { AiCapabilityKind, Prisma } from "@prisma/client";

/** States that occupy one of a worker's concurrency slots. */
const IN_FLIGHT_STATES: Prisma.AiExecutionWhereInput["state"] = {
  in: ["PREPARING", "BUILDING_CONTEXT", "RUNNING", "RETRYING"],
};

const include = {
  provider: { select: { id: true, name: true, type: true } },
  model: { select: { id: true, name: true, label: true } },
  capabilities: true,
} satisfies Prisma.AiWorkerInclude;

export type AiWorkerWithRefs = Prisma.AiWorkerGetPayload<{
  include: typeof include;
}>;

function humanizeKind(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Worker registry data access (+ capability connect-or-create). */
export const aiWorkerRepository = {
  listByWorkspace(workspaceId: string) {
    return prisma.aiWorker.findMany({
      where: { workspaceId },
      orderBy: [{ priority: "desc" }, { name: "asc" }],
      include: {
        ...include,
        _count: { select: { executions: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.aiWorker.findUnique({ where: { id }, include });
  },

  create(
    workspaceId: string,
    data: Omit<
      Prisma.AiWorkerCreateWithoutWorkspaceInput,
      "provider" | "model" | "capabilities"
    >,
    providerId: string,
    modelId: string,
    capabilityKinds: AiCapabilityKind[],
  ) {
    return prisma.aiWorker.create({
      data: {
        ...data,
        workspace: { connect: { id: workspaceId } },
        provider: { connect: { id: providerId } },
        model: { connect: { id: modelId } },
        capabilities: {
          connectOrCreate: capabilityKinds.map((kind) => ({
            where: { workspaceId_kind: { workspaceId, kind } },
            create: {
              kind,
              name: humanizeKind(kind),
              workspace: { connect: { id: workspaceId } },
            },
          })),
        },
      },
      include,
    });
  },

  update(id: string, data: Prisma.AiWorkerUpdateInput) {
    return prisma.aiWorker.update({ where: { id }, data, include });
  },

  /**
   * Schedulable candidates for a capability, with their current in-flight load
   * so the registry can honor per-worker concurrency.
   */
  async findCandidates(workspaceId: string, capability: AiCapabilityKind) {
    const workers = await prisma.aiWorker.findMany({
      where: {
        workspaceId,
        status: { in: ["ACTIVE", "IDLE"] },
        health: { in: ["HEALTHY", "DEGRADED", "UNKNOWN"] },
        capabilities: { some: { kind: capability } },
      },
      orderBy: { priority: "desc" },
      include,
    });

    const loads = await prisma.aiExecution.groupBy({
      by: ["workerId"],
      where: {
        workspaceId,
        state: IN_FLIGHT_STATES,
        workerId: { in: workers.map((w) => w.id) },
      },
      _count: { _all: true },
    });
    const loadByWorker = new Map(
      loads.map((l) => [l.workerId, l._count._all]),
    );

    return workers.map((worker) => ({
      worker,
      inFlight: loadByWorker.get(worker.id) ?? 0,
    }));
  },

  countByStatus(workspaceId: string) {
    return prisma.aiWorker.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: { _all: true },
    });
  },
};
