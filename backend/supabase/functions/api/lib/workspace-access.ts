import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getAuthenticatedUser } from "./auth.ts";

export type WorkspaceRole =
  "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type WorkspaceAccess = {
  authUserId: string;

  /**
   * public.users identity record.
   *
   * A Platform Owner may also have a public.users record.
   */
  userId: string | null;

  /**
   * Current workspace context.
   *
   * Platform Owner may access any workspace.
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
/* Workspace Access                                                           */
/* -------------------------------------------------------------------------- */

export async function getWorkspaceAccess(
  req: Request,
  supabaseAdmin: SupabaseClient<Database>,
): Promise<WorkspaceAccess> {
  const authUser = await getAuthenticatedUser(req);

  /*
   * ------------------------------------------------------------------------
   * Resolve WorkPulse identity
   * ------------------------------------------------------------------------
   *
   * public.users is the global WorkPulse identity.
   *
   * We resolve this BEFORE determining Platform Owner status because a
   * Platform Owner may also have a public.users record.
   */
  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select(
      `
        id,
        auth_enabled,
        employment_status
      `,
    )
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
   *
   * Platform Owner status is independent of whether public.users exists.
   *
   * This is important for your current account:
   *
   *   public.users exists
   *   +
   *   email matches PLATFORM_OWNER_EMAIL
   *   =
   *   Platform Owner with real WorkPulse identity
   */
  const platformOwner = isPlatformOwnerEmail(authUser.email);

  /*
   * ------------------------------------------------------------------------
   * Platform Owner
   * ------------------------------------------------------------------------
   *
   * Platform Owner can access every workspace.
   *
   * We intentionally do NOT resolve a workspace through workspace_members
   * here because the selected workspace must come from the application
   * workspace context.
   *
   * For now workspaceId remains null until the selected workspace is passed
   * into the backend context.
   */
  if (platformOwner) {
    if (user) {
      if (!user.auth_enabled) {
        throw new Error("This user is not enabled for authentication.");
      }

      if (user.employment_status !== "ACTIVE") {
        throw new Error("This user account is not active.");
      }
    }

    return {
      authUserId: authUser.id,

      userId: user?.id ?? null,

      workspaceId: null,

      role: "PLATFORM_OWNER",

      isPlatformOwner: true,
    };
  }

  /*
   * ------------------------------------------------------------------------
   * Normal Workspace User
   * ------------------------------------------------------------------------
   */

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
   * ------------------------------------------------------------------------
   * Active Workspace Membership
   * ------------------------------------------------------------------------
   *
   * workspace_members is authoritative for normal users.
   *
   * users.workspace_id is intentionally NOT used.
   *
   * This remains temporary until explicit current-workspace selection
   * is passed into the backend.
   */
  const { data: membership, error: membershipError } = await supabaseAdmin
    .from("workspace_members")
    .select(
      `
          workspace_id,
          role,
          status
        `,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw membershipError;
  }

  if (!membership) {
    throw new Error("User does not have an active workspace membership.");
  }

  return {
    authUserId: authUser.id,

    userId: user.id,

    workspaceId: membership.workspace_id,

    role: membership.role as WorkspaceRole,

    isPlatformOwner: false,
  };
}

/* -------------------------------------------------------------------------- */
/* Workspace Authorization                                                    */
/* -------------------------------------------------------------------------- */

export function assertWorkspaceAccess(
  access: WorkspaceAccess,
  workspaceId: string,
) {
  /*
   * Platform Owner can access every workspace.
   */
  if (access.isPlatformOwner) {
    return;
  }

  /*
   * Normal users are restricted to their current workspace membership.
   */
  if (!access.workspaceId) {
    throw new Error("User has no active workspace membership.");
  }

  if (access.workspaceId !== workspaceId) {
    throw new Error("You do not have access to this workspace.");
  }
}
