import { env } from "@/config/env";

import type { Workspace } from "@/features/workspace/types/workspace.types";
import type { User, UserRole } from "@/features/auth/types/auth.types";

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                             */
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
 * - platform administration is restricted to this user
 */
export function isPlatformOwner(user?: User | null): boolean {
  if (!user?.email) {
    return false;
  }

  return Boolean(env.platformOwnerEmail) && user.email === env.platformOwnerEmail;
}

/* -------------------------------------------------------------------------- */
/* Workspace Ownership                                                        */
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
/* Role Helpers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Checks if user has one of the required workspace roles.
 */
export function hasRole(user?: User | null, roles: UserRole[] = []): boolean {
  if (!user) {
    return false;
  }

  return roles.includes(user.role);
}

/* -------------------------------------------------------------------------- */
/* Platform Administration                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Platform administration access.
 *
 * This is intentionally restricted to the Platform Owner.
 *
 * Examples:
 * - Manage workspaces
 * - Manage platform-level configuration
 * - Manage workspace ownership
 * - Assign workspace administrators
 */
export function canManagePlatform(user?: User | null): boolean {
  return isPlatformOwner(user);
}

/**
 * Manage workspace administrators.
 *
 * Only the Platform Owner can create, remove, or change
 * workspace-level administrative access.
 *
 * Workspace OWNER / ADMIN / HR users must not be able to
 * promote another user to ADMIN or OWNER through the UI.
 */
export function canManageWorkspaceAdmins(user?: User | null): boolean {
  return isPlatformOwner(user);
}

/* -------------------------------------------------------------------------- */
/* Admin Access                                                               */
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
/* Workspace Management                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Workspace management.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace Owner
 * - Workspace ADMIN
 *
 * HR does not automatically receive workspace configuration access.
 */
export function canManageWorkspace(user?: User | null, workspace?: Workspace | null): boolean {
  if (!user) {
    return false;
  }

  // Platform owner has access to every workspace.
  if (isPlatformOwner(user)) {
    return true;
  }

  // Tenant/workspace owner.
  if (isWorkspaceOwner(user, workspace)) {
    return true;
  }

  // Workspace administrator.
  return hasRole(user, ["ADMIN"]);
}

/* -------------------------------------------------------------------------- */
/* User Management                                                            */
/* -------------------------------------------------------------------------- */

/**
 * User CRUD access.
 *
 * This controls ordinary workspace user management.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace OWNER
 * - ADMIN
 * - HR
 *
 * IMPORTANT:
 * This does NOT mean these users can create/promote workspace
 * administrators. That operation is controlled separately by
 * canManageWorkspaceAdmins().
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
/* Employee Management                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Employee directory and employee record management.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace OWNER
 * - ADMIN
 * - HR
 */
export function canManageEmployees(user?: User | null, workspace?: Workspace | null): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  if (isWorkspaceOwner(user, workspace)) {
    return true;
  }

  return hasRole(user, ["ADMIN", "HR"]);
}

/* -------------------------------------------------------------------------- */
/* Employee Onboarding                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Employee onboarding access.
 *
 * Allowed:
 * - Platform Owner
 * - Workspace OWNER
 * - ADMIN
 * - HR
 *
 * Employees and supervisors cannot initiate onboarding.
 */
export function canManageEmployeeOnboarding(
  user?: User | null,
  workspace?: Workspace | null,
): boolean {
  if (!user) {
    return false;
  }

  if (isPlatformOwner(user)) {
    return true;
  }

  if (isWorkspaceOwner(user, workspace)) {
    return true;
  }

  return hasRole(user, ["ADMIN", "HR"]);
}

/* -------------------------------------------------------------------------- */
/* Supervisor Access                                                          */
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
/* Reports                                                                    */
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
