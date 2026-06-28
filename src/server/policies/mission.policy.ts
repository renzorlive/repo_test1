import type { Role } from "@/types";

/**
 * MissionPolicies — pure, role-based capability checks for the Mission Engine.
 *
 * Centralizing authorization rules here keeps services free of scattered role
 * comparisons and gives one place to evolve the permission model. Services
 * call these and throw `ForbiddenError` on a `false` result.
 */

/** Capabilities a member can hold against a mission. */
export type MissionCapability =
  | "view"
  | "edit"
  | "manage" // create/delete missions, edit time/cost envelope
  | "approve" // decide approval gates
  | "contribute"; // add notes, metrics, sessions, dependencies

const RANK: Record<Role, number> = {
  VIEWER: 0,
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

/** Minimum role required for each capability. */
const REQUIRED: Record<MissionCapability, Role> = {
  view: "VIEWER",
  contribute: "MEMBER",
  edit: "MEMBER",
  approve: "ADMIN",
  manage: "ADMIN",
};

export const missionPolicy = {
  can(role: Role, capability: MissionCapability): boolean {
    return RANK[role] >= RANK[REQUIRED[capability]];
  },

  /** Convenience helpers for readable call sites. */
  canView: (role: Role) => missionPolicy.can(role, "view"),
  canEdit: (role: Role) => missionPolicy.can(role, "edit"),
  canManage: (role: Role) => missionPolicy.can(role, "manage"),
  canApprove: (role: Role) => missionPolicy.can(role, "approve"),
  canContribute: (role: Role) => missionPolicy.can(role, "contribute"),
};
