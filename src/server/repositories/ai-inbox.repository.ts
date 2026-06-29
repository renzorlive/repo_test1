import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Thresholds that drive the inbox warning lanes. */
export const INBOX_THRESHOLDS = {
  highCostUsd: 1.0,
  lowConfidence: 0.5,
} as const;

const select = {
  id: true,
  title: true,
  state: true,
  attempt: true,
  maxAttempts: true,
  confidence: true,
  error: true,
  createdAt: true,
  completedAt: true,
  worker: { select: { id: true, name: true, role: true } },
  mission: { select: { id: true, title: true } },
  cost: { select: { totalCost: true } },
} satisfies Prisma.AiExecutionSelect;

export type InboxExecution = Prisma.AiExecutionGetPayload<{
  select: typeof select;
}>;

/** Queries powering the six AI Inbox lanes. */
export const aiInboxRepository = {
  waitingApproval(workspaceId: string) {
    return prisma.aiExecution.findMany({
      where: { workspaceId, state: "WAITING_APPROVAL" },
      orderBy: { waitingApprovalAt: "asc" },
      select,
    });
  },

  failed(workspaceId: string, take: number) {
    return prisma.aiExecution.findMany({
      where: { workspaceId, state: "FAILED" },
      orderBy: { failedAt: "desc" },
      take,
      select,
    });
  },

  completed(workspaceId: string, take: number) {
    return prisma.aiExecution.findMany({
      where: { workspaceId, state: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      take,
      select,
    });
  },

  /** Failed executions that still have retry budget. */
  retrySuggestions(workspaceId: string) {
    return prisma.aiExecution.findMany({
      where: {
        workspaceId,
        state: "FAILED",
        attempt: { lt: prisma.aiExecution.fields.maxAttempts },
      },
      orderBy: { failedAt: "desc" },
      select,
    });
  },

  highCost(workspaceId: string) {
    return prisma.aiExecution.findMany({
      where: {
        workspaceId,
        cost: { totalCost: { gte: INBOX_THRESHOLDS.highCostUsd } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select,
    });
  },

  lowConfidence(workspaceId: string) {
    return prisma.aiExecution.findMany({
      where: {
        workspaceId,
        state: "COMPLETED",
        confidence: { not: null, lt: INBOX_THRESHOLDS.lowConfidence },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select,
    });
  },
};
