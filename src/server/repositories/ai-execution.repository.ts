import { prisma } from "@/lib/prisma";
import type { AiExecutionState, Prisma } from "@prisma/client";

const listSelect = {
  id: true,
  title: true,
  state: true,
  priority: true,
  attempt: true,
  maxAttempts: true,
  requiresApproval: true,
  confidence: true,
  error: true,
  createdAt: true,
  queuedAt: true,
  completedAt: true,
  worker: { select: { id: true, name: true, role: true } },
  queue: { select: { id: true, name: true } },
  mission: { select: { id: true, title: true } },
  cost: { select: { totalCost: true } },
  usage: { select: { totalTokens: true } },
} satisfies Prisma.AiExecutionSelect;

const aggregateInclude = {
  worker: {
    include: {
      provider: { select: { id: true, name: true, type: true } },
      model: { select: { id: true, name: true, label: true } },
    },
  },
  queue: true,
  mission: { select: { id: true, title: true } },
  task: { select: { id: true, title: true } },
  project: { select: { id: true, name: true, key: true } },
  requestedBy: { select: { id: true, name: true, image: true } },
  prompts: { orderBy: { version: "desc" } },
  result: true,
  cost: true,
  usage: true,
  events: { orderBy: { createdAt: "desc" } },
  logs: { orderBy: { createdAt: "desc" }, take: 100 },
  artifacts: { orderBy: { createdAt: "desc" } },
} satisfies Prisma.AiExecutionInclude;

export type AiExecutionListItem = Prisma.AiExecutionGetPayload<{
  select: typeof listSelect;
}>;
export type AiExecutionAggregate = Prisma.AiExecutionGetPayload<{
  include: typeof aggregateInclude;
}>;

/**
 * Execution aggregate data access. Owns the execution row and all of its
 * children (events, logs, prompts, result, cost, usage, artifacts) since they
 * share the execution's lifecycle.
 */
export const aiExecutionRepository = {
  findCore(id: string) {
    return prisma.aiExecution.findUnique({ where: { id } });
  },

  findAggregate(id: string): Promise<AiExecutionAggregate | null> {
    return prisma.aiExecution.findUnique({
      where: { id },
      include: aggregateInclude,
    });
  },

  listByWorkspace(
    workspaceId: string,
    args: { state?: AiExecutionState; skip?: number; take?: number },
  ) {
    const where: Prisma.AiExecutionWhereInput = {
      workspaceId,
      ...(args.state ? { state: args.state } : {}),
    };
    return prisma.$transaction([
      prisma.aiExecution.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        skip: args.skip,
        take: args.take,
        select: listSelect,
      }),
      prisma.aiExecution.count({ where }),
    ]);
  },

  create(data: Prisma.AiExecutionCreateInput) {
    return prisma.aiExecution.create({ data });
  },

  update(id: string, data: Prisma.AiExecutionUpdateInput) {
    return prisma.aiExecution.update({ where: { id }, data });
  },

  // ---- Children -------------------------------------------------------------

  createEvent(data: Prisma.AiExecutionEventCreateInput) {
    return prisma.aiExecutionEvent.create({ data });
  },

  createLog(data: Prisma.AiExecutionLogCreateInput) {
    return prisma.aiExecutionLog.create({ data });
  },

  async nextPromptVersion(executionId: string) {
    return (await prisma.aiPrompt.count({ where: { executionId } })) + 1;
  },

  createPrompt(data: Prisma.AiPromptCreateInput) {
    return prisma.aiPrompt.create({ data });
  },

  latestPrompt(executionId: string) {
    return prisma.aiPrompt.findFirst({
      where: { executionId },
      orderBy: { version: "desc" },
    });
  },

  upsertResult(executionId: string, data: Prisma.AiResultCreateWithoutExecutionInput) {
    return prisma.aiResult.upsert({
      where: { executionId },
      create: { ...data, execution: { connect: { id: executionId } } },
      update: data,
    });
  },

  upsertCost(
    executionId: string,
    workspaceId: string,
    data: Omit<Prisma.AiCostCreateWithoutExecutionInput, "workspace">,
  ) {
    return prisma.aiCost.upsert({
      where: { executionId },
      create: {
        ...data,
        execution: { connect: { id: executionId } },
        workspace: { connect: { id: workspaceId } },
      },
      update: data,
    });
  },

  upsertUsage(
    executionId: string,
    workspaceId: string,
    data: Omit<Prisma.AiUsageCreateWithoutExecutionInput, "workspace">,
  ) {
    return prisma.aiUsage.upsert({
      where: { executionId },
      create: {
        ...data,
        execution: { connect: { id: executionId } },
        workspace: { connect: { id: workspaceId } },
      },
      update: data,
    });
  },
};
