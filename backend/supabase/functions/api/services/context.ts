import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getUserContext } from "./users.ts";

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                             */
/* -------------------------------------------------------------------------- */

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

/**
 * Returns the application context for the Platform Owner.
 *
 * The Platform Owner exists only in Supabase Auth.
 *
 * They intentionally do NOT require:
 * - public.users record
 * - workspace
 * - employee record
 * - department
 * - position
 * - shift
 */
export function getPlatformOwnerContext(
  authUserId: string,
  authEmail: string | null,
) {
  if (
    !platformOwnerEmail ||
    !authEmail ||
    authEmail.trim().toLowerCase() !== platformOwnerEmail
  ) {
    throw new Error("User is not the Platform Owner.");
  }

  return {
    user: {
      auth_user_id: authUserId,

      user_id: null,

      email: authEmail,

      display_name: authEmail,

      avatar_url: null,

      employee_no: null,

      first_name: null,

      middle_name: null,

      last_name: null,

      hire_date: null,

      /*
       * Keep OWNER so the existing frontend permission
       * system recognizes the highest authority level.
       *
       * The actual Platform Owner distinction is:
       *
       * meta.platform_owner === true
       */
      role: "OWNER" as const,

      employment_status: "ACTIVE" as const,

      employment_type: "FULL_TIME" as const,

      auth_enabled: true,

      login_provider: "GOOGLE" as const,

      invited_at: null,

      last_login_at: null,

      workspace_id: null,

      department: null,

      position: null,

      shift: null,

      shift_id: undefined,

      meta: {
        platform_owner: true,
      },
    },

    workspace: null,
  };
}

/* -------------------------------------------------------------------------- */
/* Application Context                                                        */
/* -------------------------------------------------------------------------- */

export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null,
) {
  /* ------------------------------------------------------------------------ */
  /* Platform Owner                                                           */
  /* ------------------------------------------------------------------------ */

  /*
   * IMPORTANT:
   *
   * This check MUST happen before getUserContext().
   *
   * The Platform Owner intentionally does not exist in public.users.
   */
  if (
    platformOwnerEmail &&
    authEmail &&
    authEmail.trim().toLowerCase() === platformOwnerEmail
  ) {
    return getPlatformOwnerContext(authUserId, authEmail);
  }

  /* ------------------------------------------------------------------------ */
  /* Normal Workspace User                                                    */
  /* ------------------------------------------------------------------------ */

  /*
   * The authenticated Supabase Auth account is linked to WorkPulse
   * through the shared UUID:
   *
   *     auth.users.id = public.users.id
   *
   * Google authentication does NOT create a separate WorkPulse user.
   *
   * If the authenticated Auth account already exists in public.users,
   * that existing employee record is used.
   */
  const userContext = await getUserContext(
    supabaseAdmin,
    authUserId,
    authEmail,
    authProvider,
  );

  /*
   * Every normal WorkPulse user must belong to a workspace.
   */
  if (!userContext.workspace_id) {
    throw new Error("User workspace_id is missing");
  }

  /*
   * Every normal WorkPulse user must have a public.users record.
   */
  if (!userContext.user_id) {
    throw new Error("User WorkPulse record is missing.");
  }

  /* ------------------------------------------------------------------------ */
  /* Workspace                                                                */
  /* ------------------------------------------------------------------------ */

  const { data: workspace, error } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", userContext.workspace_id)
    .is("deleted_at", null)
    .single();

  if (error) {
    throw error;
  }

  if (!workspace) {
    throw new Error("User workspace not found.");
  }

  /* ------------------------------------------------------------------------ */
  /* Return Application Context                                               */
  /* ------------------------------------------------------------------------ */

  return {
    user: {
      auth_user_id: userContext.auth_user_id,

      user_id: userContext.user_id,

      email: userContext.email,

      display_name: userContext.display_name,

      avatar_url: userContext.avatar_url,

      employee_no: userContext.employee_no,

      first_name: userContext.first_name,

      middle_name: userContext.middle_name,

      last_name: userContext.last_name,

      hire_date: userContext.hire_date,

      role: userContext.role,

      employment_status: userContext.employment_status,

      employment_type: userContext.employment_type,

      auth_enabled: userContext.auth_enabled,

      login_provider: userContext.login_provider,

      invited_at: userContext.invited_at,

      last_login_at: userContext.last_login_at,

      workspace_id: userContext.workspace_id,

      department: userContext.department,

      position: userContext.position,

      shift: userContext.shift,

      shift_id: userContext.shift?.id ?? undefined,

      meta: userContext.meta,
    },

    workspace,
  };
}
