import { prisma } from "@/lib/prisma";
import type { Prisma, RuntimeCapabilityKind, RuntimeType } from "@prisma/client";

const IN_FLIGHT: Prisma.RuntimeExecutionWhereInput["status"] = {
  in: ["PENDING", "DISPATCHED", "RUNNING"],
};

function humanizeKind(kind: string) {
  return kind
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const hostInclude = {
  runtimes: {
    include: {
      capabilities: true,
      _count: { select: { executions: true } },
    },
  },
  sessions: {
    where: { status: { in: ["CONNECTING", "CONNECTED"] as const } },
    orderBy: { startedAt: "desc" },
    take: 1,
  },
} satisfies Prisma.RuntimeHostInclude;

export type RuntimeHostWithRuntimes = Prisma.RuntimeHostGetPayload<{
  include: typeof hostInclude;
}>;

/** Hosts, their sessions and heartbeats. Data access only. */
export const runtimeHostRepository = {
  listByWorkspace(workspaceId: string) {
    return prisma.runtimeHost.findMany({
      where: { workspaceId },
      orderBy: { name: "asc" },
      include: hostInclude,
    });
  },

  findById(id: string) {
    return prisma.runtimeHost.findUnique({ where: { id }, include: hostInclude });
  },

  /** Atomically create a host, a runtime on it, and a connecting session. */
  createWithRuntime(args: {
    workspaceId: string;
    host: Omit<Prisma.RuntimeHostCreateWithoutWorkspaceInput, "runtimes" | "sessions">;
    runtimeType: RuntimeType;
    runtimeName: string;
    capabilities: RuntimeCapabilityKind[];
    token: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const host = await tx.runtimeHost.create({
        data: { ...args.host, workspace: { connect: { id: args.workspaceId } } },
      });
      const runtime = await tx.runtime.create({
        data: {
          workspace: { connect: { id: args.workspaceId } },
          host: { connect: { id: host.id } },
          type: args.runtimeType,
          name: args.runtimeName,
          status: "OFFLINE",
          capabilities: {
            connectOrCreate: args.capabilities.map((kind) => ({
              where: { workspaceId_kind: { workspaceId: args.workspaceId, kind } },
              create: {
                kind,
                name: humanizeKind(kind),
                workspace: { connect: { id: args.workspaceId } },
              },
            })),
          },
        },
      });
      const session = await tx.runtimeSession.create({
        data: {
          token: args.token,
          status: "CONNECTING",
          runtime: { connect: { id: runtime.id } },
          host: { connect: { id: host.id } },
        },
      });
      return { host, runtime, session };
    });
  },

  updateHost(id: string, data: Prisma.RuntimeHostUpdateInput) {
    return prisma.runtimeHost.update({ where: { id }, data });
  },

  countRunningJobs(hostId: string) {
    return prisma.runtimeExecution.count({
      where: { hostId, status: IN_FLIGHT },
    });
  },

  // ---- Sessions -------------------------------------------------------------

  findSessionByToken(token: string) {
    return prisma.runtimeSession.findUnique({
      where: { token },
      include: { runtime: true, host: true },
    });
  },

  updateSession(id: string, data: Prisma.RuntimeSessionUpdateInput) {
    return prisma.runtimeSession.update({ where: { id }, data });
  },

  // ---- Heartbeats -----------------------------------------------------------

  createHeartbeat(data: Prisma.RuntimeHeartbeatCreateInput) {
    return prisma.runtimeHeartbeat.create({ data });
  },
};
