import { runtimeHostRepository } from "@/server/repositories";
import { requireMembership } from "@/server/services/access";
import { runtimePolicy, type RuntimeCapability } from "@/server/policies/runtime.policy";
import { ForbiddenError, UnauthorizedError } from "@/server/errors";

/** Workspace-scoped runtime capability guard (for human users). */
export async function requireRuntimeAccess(
  workspaceId: string,
  capability: RuntimeCapability = "view",
) {
  const { user, membership } = await requireMembership(workspaceId);
  if (!runtimePolicy.can(membership.role, capability)) {
    throw new ForbiddenError(
      `Your role (${membership.role}) cannot ${capability} runtimes`,
    );
  }
  return { user, membership };
}

/**
 * Authenticate a remote agent by its session token (NOT a user session). This
 * is how a machine on the other side of the network proves who it is. Returns
 * the resolved session, runtime, host and workspace.
 */
export async function requireRuntimeSession(req: Request) {
  const token = req.headers.get("x-runtime-token");
  if (!token) throw new UnauthorizedError("Missing runtime token");

  const session = await runtimeHostRepository.findSessionByToken(token);
  if (!session || session.status === "EXPIRED") {
    throw new UnauthorizedError("Invalid or expired runtime token");
  }

  return {
    session,
    runtime: session.runtime,
    host: session.host,
    workspaceId: session.host.workspaceId,
  };
}
