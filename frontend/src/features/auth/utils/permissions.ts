import { env } from "@/config/env";

import type { Workspace } from "@/features/workspace/types/workspace.types";
import type { User, UserRole } from "@/features/auth/types/auth.types";

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Platform Owner:
 *
 * Highest authority level.
 *
 * Controlled by:
 * VITE_PLATFORM_OWNER_EMAIL
 *
 * Rules:
 * - ignores database role
 * - ignores workspace ownership
 * - has access to all workspaces
 */
export function isPlatformOwner(user?: User | null): boolean {
  if (!user?.email) {
    return false;
  }

  return Boolean(env.platformOwnerEmail) && user.email === env.platformOwnerEmail;
}

/* -------------------------------------------------------------------------- */
/* Workspace Ownership                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Checks if user owns the current workspace.
 */
export function isWorkspaceOwner(user?: User | null, workspace?: Workspace | null): boolean {
  if (!user?.email || !workspace?.owner_email) {
    return false;
  }

  return user.email === workspace.owner_email;
}

/* -------------------------------------------------------------------------- */
/* Role Helpers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Checks if user has one of the required roles.
 */
export function hasRole(user?: User | null, roles: UserRole[] = []): boolean {
  if (!user) {
    return false;
  }

  return roles.includes(user.role as UserRole);
}

/* -------------------------------------------------------------------------- */
/* Admin Access                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Admin dashboard access.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace OWNER
 * - ADMIN
 * - HR
 */
export function canAccessAdmin(user?: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  return hasRole(user, ["OWNER", "ADMIN", "HR"]);
}

/* -------------------------------------------------------------------------- */
/* Supervisor Access                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Attendance supervision features.
 *
 * Allowed:
 * - Platform Owner
 * - OWNER
 * - ADMIN
 * - HR
 * - SUPERVISOR
 */
export function canAccessSupervisorFeatures(user?: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  return hasRole(user, ["OWNER", "ADMIN", "HR", "SUPERVISOR"]);
}

/* -------------------------------------------------------------------------- */
/* User Management                                                             */
/* -------------------------------------------------------------------------- */

/**
 * User CRUD access.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace OWNER
 * - ADMIN
 * - HR
 */
export function canManageUsers(user?: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  return hasRole(user, ["OWNER", "ADMIN", "HR"]);
}

/* -------------------------------------------------------------------------- */
/* Workspace Management                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Workspace management priority:
 *
 * 1. Platform Owner
 * 2. Workspace Owner
 * 3. Workspace ADMIN
 */
export function canManageWorkspace(user?: User | null, workspace?: Workspace | null): boolean {
  if (!user) {
    return false;
  }

  // Global owner
  if (isPlatformOwner(user)) {
    return true;
  }

  // Tenant owner
  if (isWorkspaceOwner(user, workspace)) {
    return true;
  }

  // Workspace administrator
  return hasRole(user, ["ADMIN"]);
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Report viewing access.
 *
 * Allowed:
 * - Platform Owner
 * - OWNER
 * - ADMIN
 * - HR
 * - SUPERVISOR
 */
export function canViewReports(user?: User | null): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  return hasRole(user, ["OWNER", "ADMIN", "HR", "SUPERVISOR"]);
}
