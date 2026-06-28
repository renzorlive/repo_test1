import "server-only";
import { workspaceService } from "@/server/services";

/**
 * Resolve the current user's active workspace for server components.
 *
 * Until an explicit workspace switcher persists a selection (see TODO), the
 * active workspace is the user's first membership. Returns null when the user
 * belongs to no workspace, so callers can render an empty state.
 */
export async function getActiveWorkspace() {
  const workspaces = await workspaceService.listForCurrentUser();
  return workspaces[0] ?? null;
}
