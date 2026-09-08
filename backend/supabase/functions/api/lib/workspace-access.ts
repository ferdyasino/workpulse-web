import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getAuthenticatedUser } from "./auth.ts";

export type WorkspaceRole =
  "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type WorkspaceAccess = {
  authUserId: string;

  /**
   * Global public.users identity.
   *
   * A Platform Owner may also have a public.users record.
   */
  userId: string | null;

  /**
   * Current selected workspace.
   *
   * This is the authoritative workspace context for the request.
   */
  workspaceId: string | null;

  /**
   * Role within the current workspace.
   */
  role: WorkspaceRole | "PLATFORM_OWNER";

  isPlatformOwner: boolean;
};

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                             */
/* -------------------------------------------------------------------------- */

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!platformOwnerEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === platformOwnerEmail;
}

/* -------------------------------------------------------------------------- */
/* Workspace Resolution                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the workspace for a normal user.
 *
 * Rules:
 *
 * 1. Explicit workspace:
 *    - Must be an active workspace_members relationship.
 *
 * 2. No workspace:
 *    - One active workspace -> automatically select it.
 *    - Multiple active workspaces -> require explicit selection.
 *    - No active workspaces -> reject.
 *
 * users.workspace_id is intentionally NOT used.
 */
async function resolveNormalUserWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  workspaceId: string | null,
): Promise<{
  workspaceId: string;
  role: WorkspaceRole;
}> {
  /*
   * ------------------------------------------------------------------------
   * Explicit workspace selection
   * ------------------------------------------------------------------------
   */
  if (workspaceId) {
    const { data: membership, error } = await supabaseAdmin
      .from("workspace_members")
      .select("workspace_id, role, status")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!membership) {
      throw new Error(
        "You do not have an active membership in this workspace.",
      );
    }

    return {
      workspaceId: membership.workspace_id,
      role: membership.role as WorkspaceRole,
    };
  }

  /*
   * ------------------------------------------------------------------------
   * No explicit workspace selection
   * ------------------------------------------------------------------------
   */
  const { data: memberships, error } = await supabaseAdmin
    .from("workspace_members")
    .select("workspace_id, role, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error) {
    throw error;
  }

  if (!memberships || memberships.length === 0) {
    throw new Error("User does not have an active workspace membership.");
  }

  /*
   * Exactly one active workspace:
   * automatically select it.
   */
  if (memberships.length === 1) {
    const membership = memberships[0];

    return {
      workspaceId: membership.workspace_id,
      role: membership.role as WorkspaceRole,
    };
  }

  /*
   * Multiple active workspaces:
   * explicit selection is required.
   */
  throw new Error("Multiple workspaces found. A workspace must be selected.");
}

/**
 * Resolve the workspace for a Platform Owner.
 *
 * Platform Owner does not require workspace_members membership.
 *
 * No workspace:
 *   -> global Platform Owner context.
 *
 * Selected workspace:
 *   -> validate that the workspace exists and is active.
 */
async function resolvePlatformOwnerWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string | null,
): Promise<string | null> {
  if (!workspaceId) {
    return null;
  }

  const { data: workspace, error } = await supabaseAdmin
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  return workspace.id;
}

/* -------------------------------------------------------------------------- */
/* Workspace Access                                                           */
/* -------------------------------------------------------------------------- */

export async function getWorkspaceAccess(
  req: Request,
  supabaseAdmin: SupabaseClient<Database>,
  selectedWorkspaceId: string | null = null,
): Promise<WorkspaceAccess> {
  const authUser = await getAuthenticatedUser(req);

  const workspaceId =
    typeof selectedWorkspaceId === "string" &&
    selectedWorkspaceId.trim().length > 0
      ? selectedWorkspaceId.trim()
      : null;

  /*
   * ------------------------------------------------------------------------
   * Resolve WorkPulse identity
   * ------------------------------------------------------------------------
   *
   * public.users is the global WorkPulse identity.
   *
   * A Platform Owner may exist in Auth without a public.users record.
   */
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id, auth_enabled, employment_status")
    .eq("id", authUser.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  /*
   * ------------------------------------------------------------------------
   * Determine Platform Owner
   * ------------------------------------------------------------------------
   */
  const platformOwner = isPlatformOwnerEmail(authUser.email);

  /* ---------------------------------------------------------------------- */
  /* Platform Owner                                                         */
  /* ---------------------------------------------------------------------- */

  if (platformOwner) {
    /*
     * If the Platform Owner has a WorkPulse identity, it must still be
     * enabled and active.
     */
    if (user) {
      if (!user.auth_enabled) {
        throw new Error("This user is not enabled for authentication.");
      }

      if (user.employment_status !== "ACTIVE") {
        throw new Error("This user account is not active.");
      }
    }

    /*
     * Platform Owner can access any active workspace.
     *
     * workspace_members membership is NOT required.
     */
    const resolvedWorkspaceId = await resolvePlatformOwnerWorkspace(
      supabaseAdmin,
      workspaceId,
    );

    return {
      authUserId: authUser.id,
      userId: user?.id ?? null,
      workspaceId: resolvedWorkspaceId,
      role: "PLATFORM_OWNER",
      isPlatformOwner: true,
    };
  }

  /* ---------------------------------------------------------------------- */
  /* Normal Workspace User                                                  */
  /* ---------------------------------------------------------------------- */

  if (!user) {
    throw new Error("WorkPulse user account not found.");
  }

  if (!user.auth_enabled) {
    throw new Error("This user is not enabled for authentication.");
  }

  if (user.employment_status !== "ACTIVE") {
    throw new Error("This user account is not active.");
  }

  /*
   * Resolve the selected workspace exclusively through
   * workspace_members.
   *
   * users.workspace_id is NOT used.
   */
  const resolvedWorkspace = await resolveNormalUserWorkspace(
    supabaseAdmin,
    user.id,
    workspaceId,
  );

  return {
    authUserId: authUser.id,
    userId: user.id,
    workspaceId: resolvedWorkspace.workspaceId,
    role: resolvedWorkspace.role,
    isPlatformOwner: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Workspace Authorization                                                    */
/* -------------------------------------------------------------------------- */

export function assertWorkspaceAccess(
  access: WorkspaceAccess,
  workspaceId: string,
): void {
  /*
   * Platform Owner can access every workspace.
   *
   * The workspace itself is validated when the context is resolved.
   */
  if (access.isPlatformOwner) {
    return;
  }

  /*
   * Normal users must have an active selected workspace.
   */
  if (!access.workspaceId) {
    throw new Error("User has no active workspace membership.");
  }

  /*
   * Prevent cross-workspace access.
   */
  if (access.workspaceId !== workspaceId) {
    throw new Error("You do not have access to this workspace.");
  }
}
