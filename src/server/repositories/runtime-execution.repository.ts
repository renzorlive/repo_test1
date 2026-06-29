import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const listSelect = {
  id: true,
  status: true,
  exitCode: true,
  error: true,
  attempt: true,
  maxAttempts: true,
  queuedAt: true,
  startedAt: true,
  finishedAt: true,
  command: { select: { name: true, command: true } },
  host: { select: { id: true, name: true } },
  runtime: { select: { id: true, type: true } },
  aiExecution: { select: { id: true, title: true } },
} satisfies Prisma.RuntimeExecutionSelect;

const aggregateInclude = {
  command: true,
  host: true,
  runtime: { include: { host: true } },
  session: { select: { id: true, status: true } },
  aiExecution: { select: { id: true, title: true, missionId: true } },
  terminal: true,
  logs: { orderBy: { sequence: "asc" }, take: 1000 },
  artifacts: { orderBy: { createdAt: "asc" } },
  heartbeats: { orderBy: { createdAt: "desc" }, take: 20 },
} satisfies Prisma.RuntimeExecutionInclude;

export type RuntimeExecutionListItem = Prisma.RuntimeExecutionGetPayload<{
  select: typeof listSelect;
}>;
export type RuntimeExecutionAggregate = Prisma.RuntimeExecutionGetPayload<{
  include: typeof aggregateInclude;
}>;

export const runtimeExecutionRepository = {
  findCore(id: string) {
    return prisma.runtimeExecution.findUnique({
      where: { id },
      include: {
        command: true,
        runtime: { select: { id: true, type: true } },
        aiExecution: { select: { id: true, missionId: true } },
      },
    });
  },

  findAggregate(id: string): Promise<RuntimeExecutionAggregate | null> {
    return prisma.runtimeExecution.findUnique({
      where: { id },
      include: aggregateInclude,
    });
  },

  listByWorkspace(
    workspaceId: string,
    args: { status?: Prisma.RuntimeExecutionWhereInput["status"]; take?: number },
  ) {
    return prisma.runtimeExecution.findMany({
      where: { workspaceId, ...(args.status ? { status: args.status } : {}) },
      orderBy: { createdAt: "desc" },
      take: args.take,
      select: listSelect,
    });
  },

  /** Create the command + execution + an open terminal in one write. */
  create(args: {
    workspaceId: string;
    command: {
      name: string;
      command: string;
      args: string[];
      cwd?: string;
      env: Record<string, string>;
      prompt?: string;
      timeoutMs: number;
    };
    aiExecutionId?: string;
  }) {
    return prisma.runtimeExecution.create({
      data: {
        workspace: { connect: { id: args.workspaceId } },
        command: {
          create: {
            workspace: { connect: { id: args.workspaceId } },
            name: args.command.name,
            command: args.command.command,
            args: args.command.args as unknown as Prisma.InputJsonValue,
            cwd: args.command.cwd,
            env: args.command.env as unknown as Prisma.InputJsonValue,
            prompt: args.command.prompt,
            timeoutMs: args.command.timeoutMs,
          },
        },
        ...(args.aiExecutionId
          ? { aiExecution: { connect: { id: args.aiExecutionId } } }
          : {}),
        terminal: { create: {} },
      },
      include: { command: true },
    });
  },

  update(id: string, data: Prisma.RuntimeExecutionUpdateInput) {
    return prisma.runtimeExecution.update({ where: { id }, data });
  },

  countByStatus(workspaceId: string) {
    return prisma.runtimeExecution.groupBy({
      by: ["status"],
      where: { workspaceId },
      _count: { _all: true },
    });
  },

  /** The oldest dispatched job for a runtime, for the agent to claim. */
  claimNext(runtimeId: string) {
    return prisma.runtimeExecution.findFirst({
      where: { runtimeId, status: "DISPATCHED" },
      orderBy: { dispatchedAt: "asc" },
      include: { command: true },
    });
  },

  async nextLogSequence(executionId: string) {
    const last = await prisma.runtimeLog.findFirst({
      where: { executionId },
      orderBy: { sequence: "desc" },
      select: { sequence: true },
    });
    return (last?.sequence ?? -1) + 1;
  },

  appendLogs(rows: Prisma.RuntimeLogCreateManyInput[]) {
    return prisma.runtimeLog.createMany({ data: rows });
  },

  createArtifacts(rows: Prisma.RuntimeArtifactCreateManyInput[]) {
    return prisma.runtimeArtifact.createMany({ data: rows });
  },

  listArtifacts(executionId: string) {
    return prisma.runtimeArtifact.findMany({ where: { executionId } });
  },

  markArtifactStored(id: string, missionArtifactId: string) {
    return prisma.runtimeArtifact.update({
      where: { id },
      data: { missionArtifactId },
    });
  },

  createHeartbeat(data: Prisma.RuntimeHeartbeatCreateInput) {
    return prisma.runtimeHeartbeat.create({ data });
  },

  updateTerminal(executionId: string, data: Prisma.RuntimeTerminalUpdateInput) {
    return prisma.runtimeTerminal.update({ where: { executionId }, data });
  },
};
