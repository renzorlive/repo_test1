import { aiExecutionRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { aiPolicy, type AiCapability } from "@/server/policies/ai.policy";
import { ForbiddenError, NotFoundError } from "@/server/errors";

/** Workspace-scoped AI capability guard. */
export async function requireAiAccess(
  workspaceId: string,
  capability: AiCapability = "view",
) {
  const { user, membership } = await requireMembership(workspaceId);
  if (!aiPolicy.can(membership.role, capability)) {
    throw new ForbiddenError(
      `Your role (${membership.role}) cannot ${capability} AI resources`,
    );
  }
  return { user, membership };
}

/** Execution-scoped guard: capability + cross-tenant ownership check. */
export async function requireExecutionAccess(
  workspaceId: string,
  executionId: string,
  capability: AiCapability,
) {
  const ctx = await requireAiAccess(workspaceId, capability);
  const execution = await aiExecutionRepository.findCore(executionId);
  if (!execution || execution.workspaceId !== workspaceId) {
    throw new NotFoundError("Execution not found");
  }
  return { ...ctx, execution };
}
