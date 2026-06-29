import type { Role } from "@/types";

/**
 * Runtime Layer authorization. Operating runtimes (dispatch/cancel/retry jobs)
 * requires MEMBER+; registering or removing machines requires ADMIN+.
 */
export type RuntimeCapability = "view" | "operate" | "manage";

const RANK: Record<Role, number> = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 };
const REQUIRED: Record<RuntimeCapability, Role> = {
  view: "VIEWER",
  operate: "MEMBER",
  manage: "ADMIN",
};

export const runtimePolicy = {
  can(role: Role, capability: RuntimeCapability): boolean {
    return RANK[role] >= RANK[REQUIRED[capability]];
  },
  canView: (role: Role) => runtimePolicy.can(role, "view"),
  canOperate: (role: Role) => runtimePolicy.can(role, "operate"),
  canManage: (role: Role) => runtimePolicy.can(role, "manage"),
};
