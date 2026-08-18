import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getAuthenticatedUser } from "./auth.ts";

export type WorkspaceRole =
  "OWNER" | "ADMIN" | "HR" | "SUPERVISOR" | "EMPLOYEE";

export type WorkspaceAccess = {
  authUserId: string;

  /**
   * null for Platform Owner because the Platform Owner
   * does not require a public.users record.
   */
  userId: string | null;

  /**
   * null for Platform Owner because the Platform Owner
   * is not tied to a single workspace.
   */
  workspaceId: string | null;

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
   * PLATFORM OWNER
   * ------------------------------------------------------------------------
   *
   * The Platform Owner exists only in Supabase Auth.
   *
   * They intentionally do NOT require:
   *
   * - public.users
   * - workspace_id
   * - workspace ownership
   *
   * Authority is determined by PLATFORM_OWNER_EMAIL.
   */
  if (isPlatformOwnerEmail(authUser.email)) {
    return {
      authUserId: authUser.id,

      userId: null,

      workspaceId: null,

      role: "PLATFORM_OWNER",

      isPlatformOwner: true,
    };
  }

  /*
   * ------------------------------------------------------------------------
   * NORMAL WORKSPACE USER
   * ------------------------------------------------------------------------
   */

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select(
      `
        id,
        workspace_id,
        role,
        auth_enabled,
        employment_status
      `,
    )
    .eq("id", authUser.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("WorkPulse user account not found.");
  }

  if (!user.auth_enabled) {
    throw new Error("This user is not enabled for authentication.");
  }

  if (user.employment_status !== "ACTIVE") {
    throw new Error("This user account is not active.");
  }

  if (!user.workspace_id) {
    throw new Error("User workspace_id is missing.");
  }

  return {
    authUserId: authUser.id,

    userId: user.id,

    workspaceId: user.workspace_id,

    role: user.role as WorkspaceRole,

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
   * Normal users are restricted to their assigned workspace.
   */
  if (!access.workspaceId) {
    throw new Error("User workspace_id is missing.");
  }

  if (access.workspaceId !== workspaceId) {
    throw new Error("You do not have access to this workspace.");
  }
}
