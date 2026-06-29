import type { Role } from "@/types";

/**
 * AI Orchestrator authorization. Role-ranked capabilities, mirroring the
 * mission policy. Registry mutation and execution approval require ADMIN+;
 * running executions requires MEMBER+; everyone in the workspace can view.
 */
export type AiCapability =
  | "view"
  | "run" // submit / retry / cancel executions
  | "approve" // approve / reject executions awaiting a gate
  | "manage"; // providers, models, workers, queues

const RANK: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

const REQUIRED: Record<AiCapability, Role> = {
  view: "VIEWER",
  run: "MEMBER",
  approve: "ADMIN",
  manage: "ADMIN",
};

export const aiPolicy = {
  can(role: Role, capability: AiCapability): boolean {
    return RANK[role] >= RANK[REQUIRED[capability]];
  },
  canView: (role: Role) => aiPolicy.can(role, "view"),
  canRun: (role: Role) => aiPolicy.can(role, "run"),
  canApprove: (role: Role) => aiPolicy.can(role, "approve"),
  canManage: (role: Role) => aiPolicy.can(role, "manage"),
};
