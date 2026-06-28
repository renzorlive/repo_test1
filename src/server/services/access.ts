import { auth } from "@/lib/auth";
import { workspaceRepository } from "@/server/repositories";
import { ForbiddenError, UnauthorizedError } from "@/server/errors";

/** Resolve the current authenticated user id or throw. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user;
}

/**
 * Ensure the current user is a member of the given workspace.
 * Returns the membership (with role) so callers can do role checks.
 */
export async function requireMembership(workspaceId: string) {
  const user = await requireUser();
  const membership = await workspaceRepository.findMembership(
    user.id,
    workspaceId,
  );
  if (!membership) {
    throw new ForbiddenError();
  }
  return { user, membership };
}
