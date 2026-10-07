import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import { getUserContext } from "./users.ts";
import { resolveUserShift } from "./user_shift_resolver.ts";

import { resolveWorkWindow } from "../services/attendance/workwindow.ts";

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                             */
/* -------------------------------------------------------------------------- */

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

function isPlatformOwnerEmail(authEmail: string | null): boolean {
  if (!platformOwnerEmail || !authEmail) {
    return false;
  }

  return authEmail.trim().toLowerCase() === platformOwnerEmail;
}

/**
 * Build the synthetic Platform Owner context.
 *
 * Platform Owner authentication is based on the authenticated Supabase
 * identity plus PLATFORM_OWNER_EMAIL.
 *
 * A public.users record is NOT required for the Platform Owner.
 */
export function getPlatformOwnerContext(
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null,
) {
  if (!isPlatformOwnerEmail(authEmail)) {
    throw new Error("Invalid credentials.");
  }

  return {
    user: {
      /*
       * Supabase Auth UUID is always the authoritative authentication
       * identity, including for the Platform Owner.
       */
      auth_user_id: authUserId,

      /*
       * Platform Owner may exist without a public.users record.
       */
      user_id: null,

      email: authEmail,

      display_name: authEmail,

      avatar_url: null,

      employee_no: null,

      first_name: null,

      middle_name: null,

      last_name: null,

      hire_date: null,

      role: "OWNER" as const,

      employment_status: "ACTIVE" as const,

      employment_type: "FULL_TIME" as const,

      /*
       * Platform Owner is always considered enabled by the application
       * authorization layer.
       *
       * Supabase Auth still remains responsible for actual authentication.
       */
      auth_enabled: true,

      /*
       * Preserve the authenticated provider when available.
       */
      login_provider: authProvider ?? "GOOGLE",

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
/* Workspace Helpers                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Resolve an explicitly requested workspace for a normal user.
 *
 * workspace_members is the authoritative source for workspace access.
 */
async function resolveNormalUserWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  requestedWorkspaceId: string | null,
) {
  /* ------------------------------------------------------------------------ */
  /* Explicit workspace selected                                             */
  /* ------------------------------------------------------------------------ */

  if (requestedWorkspaceId) {
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("workspace_members")
      .select(
        `
          id,
          workspace_id,
          user_id,
          status,
          deleted_at
        `,
      )
      .eq("workspace_id", requestedWorkspaceId)
      .eq("user_id", authUserId)
      .maybeSingle();

    if (membershipError) {
      throw membershipError;
    }

    if (!membership) {
      throw new Error("User does not belong to this workspace.");
    }

    if (membership.deleted_at !== null) {
      throw new Error("User workspace membership has been deleted.");
    }

    if (membership.status !== "ACTIVE") {
      throw new Error("User workspace membership is not active.");
    }

    return {
      workspaceId: membership.workspace_id,
      membership,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* No workspace explicitly selected                                        */
  /* ------------------------------------------------------------------------ */

  const { data: memberships, error: membershipsError } = await supabaseAdmin
    .from("workspace_members")
    .select(
      `
        id,
        workspace_id,
        user_id,
        status,
        deleted_at,
        created_at
      `,
    )
    .eq("user_id", authUserId)
    .eq("status", "ACTIVE")
    .is("deleted_at", null)
    .order("created_at", {
      ascending: true,
    });

  if (membershipsError) {
    throw membershipsError;
  }

  if (!memberships || memberships.length === 0) {
    throw new Error("User does not belong to any active workspace.");
  }

  /*
   * One workspace can be selected automatically.
   */
  if (memberships.length === 1) {
    return {
      workspaceId: memberships[0].workspace_id,
      membership: memberships[0],
    };
  }

  /*
   * Multiple workspaces require explicit selection.
   */
  throw new Error("Multiple workspaces found. A workspace must be selected.");
}

/**
 * Resolve a workspace for Platform Owner.
 *
 * Platform Owner does not require workspace_members for administrative
 * workspace access.
 */
async function resolvePlatformOwnerWorkspace(
  supabaseAdmin: SupabaseClient<Database>,
  workspaceId: string,
) {
  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspace) {
    throw new Error("Workspace not found.");
  }

  return workspace;
}

/* -------------------------------------------------------------------------- */
/* Application Context                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the authenticated Supabase identity into a WorkPulse application
 * context.
 *
 * IMPORTANT:
 *
 * Password authentication is NOT performed here.
 *
 * Email/password:
 *
 *   supabase.auth.signInWithPassword()
 *              ↓
 *       Supabase validates password
 *              ↓
 *       authenticated Supabase session
 *              ↓
 *       getApplicationContext()
 *
 * Google:
 *
 *   supabase.auth.signInWithIdToken()
 *              ↓
 *       Supabase validates Google token
 *              ↓
 *       authenticated Supabase session
 *              ↓
 *       getApplicationContext()
 *
 * This function only handles WorkPulse authorization after Supabase
 * authentication has already succeeded.
 */
export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null,
  workspace_id: string | null = null,
) {
  /* ------------------------------------------------------------------------ */
  /* Authentication Identity Validation                                      */
  /* ------------------------------------------------------------------------ */

  /*
   * Supabase Auth UUID is the authoritative identity.
   *
   * Never fall back to email matching.
   */
  const normalizedAuthUserId = authUserId?.trim();

  if (!normalizedAuthUserId) {
    throw new Error("Invalid credentials.");
  }

  const normalizedWorkspaceId = workspace_id?.trim() || null;

  /* ------------------------------------------------------------------------ */
  /* Platform Owner                                                           */
  /* ------------------------------------------------------------------------ */

  /*
   * Platform Owner is the ONLY exception to the requirement that a
   * WorkPulse user must have a public.users record.
   *
   * The Platform Owner is identified by the authenticated email configured
   * in PLATFORM_OWNER_EMAIL.
   */
  if (isPlatformOwnerEmail(authEmail)) {
    /* ---------------------------------------------------------------------- */
    /* Check optional public.users record                                     */
    /* ---------------------------------------------------------------------- */

    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("id, auth_enabled")
      .eq("id", normalizedAuthUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    /* ---------------------------------------------------------------------- */
    /* Platform Owner without public.users                                    */
    /* ---------------------------------------------------------------------- */

    if (!existingUser) {
      /*
       * No workspace selected.
       *
       * Return global Platform Owner context.
       */
      if (!normalizedWorkspaceId) {
        return getPlatformOwnerContext(
          normalizedAuthUserId,
          authEmail,
          authProvider,
        );
      }

      /*
       * Platform Owner may administer any active workspace.
       *
       * workspace_members is NOT required.
       */
      const workspace = await resolvePlatformOwnerWorkspace(
        supabaseAdmin,
        normalizedWorkspaceId,
      );

      const platformContext = getPlatformOwnerContext(
        normalizedAuthUserId,
        authEmail,
        authProvider,
      );

      return {
        user: {
          ...platformContext.user,
          workspace_id: workspace.id,
        },

        workspace,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* Platform Owner with public.users                                       */
    /* ---------------------------------------------------------------------- */

    /*
     * Platform Owner remains exempt from auth_enabled.
     *
     * PLATFORM_OWNER_EMAIL + authenticated Supabase identity is the
     * Platform Owner authorization mechanism.
     */
    const userContext = await getUserContext(
      supabaseAdmin,
      normalizedAuthUserId,
      authEmail,
      authProvider,
      null,
    );

    if (!userContext.user_id) {
      throw new Error("Invalid credentials.");
    }

    /* ---------------------------------------------------------------------- */
    /* Platform Owner without selected workspace                              */
    /* ---------------------------------------------------------------------- */

    if (!normalizedWorkspaceId) {
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

          workspace_id: null,

          department: userContext.department,

          position: userContext.position,

          shift: null,

          shift_id: undefined,

          meta: {
            ...(userContext.meta &&
            typeof userContext.meta === "object" &&
            !Array.isArray(userContext.meta)
              ? userContext.meta
              : {}),
            platform_owner: true,
          },
        },

        workspace: null,
      };
    }

    /* ---------------------------------------------------------------------- */
    /* Platform Owner with selected workspace                                 */
    /* ---------------------------------------------------------------------- */

    /*
     * Platform Owner may administer the selected workspace without a
     * workspace_members record.
     *
     * Attendance authorization remains separate and must still require
     * actual membership where applicable.
     */
    const workspace = await resolvePlatformOwnerWorkspace(
      supabaseAdmin,
      normalizedWorkspaceId,
    );

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

        workspace_id: workspace.id,

        department: userContext.department,

        position: userContext.position,

        shift: null,

        shift_id: undefined,

        meta: {
          ...(userContext.meta &&
          typeof userContext.meta === "object" &&
          !Array.isArray(userContext.meta)
            ? userContext.meta
            : {}),
          platform_owner: true,
        },
      },

      workspace,
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Normal WorkPulse User                                                    */
  /* ------------------------------------------------------------------------ */

  /*
   * Required relationship:
   *
   *   auth.users.id
   *          =
   *   public.users.id
   *
   * Email is deliberately NOT used as a fallback.
   */
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("users")
    .select("id, auth_enabled")
    .eq("id", normalizedAuthUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  /* ------------------------------------------------------------------------ */
  /* Authenticated but not registered in WorkPulse                            */
  /* ------------------------------------------------------------------------ */

  /*
   * Supabase authentication succeeding is NOT enough to access WorkPulse.
   *
   * A normal user must have a matching public.users record.
   *
   * This prevents Google users from entering WorkPulse merely because
   * Google authentication succeeded.
   */
  if (!existingUser) {
    throw new Error("Invalid credentials.");
  }

  /* ------------------------------------------------------------------------ */
  /* WorkPulse Authentication Enabled Check                                   */
  /* ------------------------------------------------------------------------ */

  /*
   * auth_enabled is a WorkPulse application-level login control.
   *
   * Supabase Auth may have successfully authenticated the user, but the
   * user is still denied access to WorkPulse when auth_enabled is false.
   *
   * Use the generic error to avoid exposing account state.
   */
  if (!existingUser.auth_enabled) {
    throw new Error("Invalid credentials.");
  }

  /* ------------------------------------------------------------------------ */
  /* Resolve Workspace                                                        */
  /* ------------------------------------------------------------------------ */

  const resolvedWorkspace = await resolveNormalUserWorkspace(
    supabaseAdmin,
    normalizedAuthUserId,
    normalizedWorkspaceId,
  );

  const workspaceId = resolvedWorkspace.workspaceId;

  if (!workspaceId) {
    throw new Error("User workspace could not be resolved.");
  }

  /* ------------------------------------------------------------------------ */
  /* Resolve Workspace-Specific User Context                                  */
  /* ------------------------------------------------------------------------ */

  const userContext = await getUserContext(
    supabaseAdmin,
    normalizedAuthUserId,
    authEmail,
    authProvider,
    workspaceId,
  );

  if (!userContext.workspace_id) {
    throw new Error("User workspace could not be resolved.");
  }

  if (!userContext.user_id) {
    throw new Error("Invalid credentials.");
  }

  /*
   * Defense-in-depth:
   *
   * getUserContext() and workspace_members must resolve to the same
   * workspace.
   */
  if (userContext.workspace_id !== workspaceId) {
    throw new Error("User does not belong to this workspace.");
  }

  /* ------------------------------------------------------------------------ */
  /* Workspace                                                                */
  /* ------------------------------------------------------------------------ */

  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (workspaceError) {
    throw workspaceError;
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

/* -------------------------------------------------------------------------- */
/* Attendance Context                                                         */
/* -------------------------------------------------------------------------- */

export type ResolveAttendanceContextOptions = {
  supabaseAdmin: SupabaseClient<Database>;

  workspaceId: string;

  userId: string;

  timestamp: Date;

  requestedShiftId?: string | null;

  requestedWorkDate?: string | null;
};

export type AttendanceContext = {
  workDate: string;

  timezone: string;

  shift: NonNullable<Awaited<ReturnType<typeof resolveUserShift>>>["shift"];

  userShiftId: string;

  assignmentId: string;

  assignmentSource: string;

  startsAt: Date;

  endsAt: Date;
};

/* -------------------------------------------------------------------------- */
/* Attendance Helpers                                                         */
/* -------------------------------------------------------------------------- */

function getUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getLocalCalendarDate(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return [values.year, values.month, values.day].join("-");
}

/* -------------------------------------------------------------------------- */
/* Resolve Attendance Context                                                 */
/* -------------------------------------------------------------------------- */

export async function resolveAttendanceContext(
  options: ResolveAttendanceContextOptions,
): Promise<AttendanceContext | null> {
  const {
    supabaseAdmin,
    workspaceId,
    userId,
    timestamp,
    requestedShiftId,
    requestedWorkDate,
  } = options;

  /* ------------------------------------------------------------------------ */
  /* Input Validation                                                         */
  /* ------------------------------------------------------------------------ */

  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }

  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid attendance timestamp.");
  }

  /* ------------------------------------------------------------------------ */
  /* Initial Assignment Lookup                                                */
  /* ------------------------------------------------------------------------ */

  const initialLookupDate = requestedWorkDate ?? getUtcDate(timestamp);

  let resolved = await resolveUserShift(supabaseAdmin, {
    workspace_id: workspaceId,
    user_id: userId,
    date: initialLookupDate,
  });

  if (!resolved) {
    return null;
  }

  if (!resolved.shift) {
    throw new Error("Resolved user shift does not contain a shift.");
  }

  /* ------------------------------------------------------------------------ */
  /* Determine Effective Shift Timezone                                       */
  /* ------------------------------------------------------------------------ */

  const firstShift = resolved.shift;

  const timezone = firstShift.timezone;

  /* ------------------------------------------------------------------------ */
  /* Resolve Local Calendar Date                                              */
  /* ------------------------------------------------------------------------ */

  const localCalendarDate = getLocalCalendarDate(timestamp, timezone);

  if (!requestedWorkDate && localCalendarDate !== initialLookupDate) {
    const localResolved = await resolveUserShift(supabaseAdmin, {
      workspace_id: workspaceId,
      user_id: userId,
      date: localCalendarDate,
    });

    if (localResolved) {
      resolved = localResolved;
    }
  }

  const shift = resolved.shift;

  if (!shift) {
    throw new Error("Resolved user shift does not contain a shift.");
  }

  /* ------------------------------------------------------------------------ */
  /* Validate Requested Shift                                                 */
  /* ------------------------------------------------------------------------ */

  if (requestedShiftId && requestedShiftId !== shift.id) {
    throw new Error(
      "The requested shift does not match the user's effective shift.",
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Permanent user_shift Reference                                           */
  /* ------------------------------------------------------------------------ */

  const userShiftId = resolved.user_shift_id;

  if (!userShiftId) {
    throw new Error(
      "Resolved shift does not have a matching user shift assignment.",
    );
  }

  const assignmentId = resolved.assignment_id;

  if (!assignmentId) {
    throw new Error("Resolved shift does not have an assignment ID.");
  }

  /* ------------------------------------------------------------------------ */
  /* Resolve Actual Work Window                                               */
  /* ------------------------------------------------------------------------ */

  const window = resolveWorkWindow({
    timestamp,
    shiftStart: shift.start_time,
    shiftEnd: shift.end_time,
    isOvernight: shift.is_overnight,
    timezone: shift.timezone,
  });

  /* ------------------------------------------------------------------------ */
  /* Return Authoritative Attendance Context                                  */
  /* ------------------------------------------------------------------------ */

  return {
    workDate: window.workDate,

    timezone: shift.timezone,

    shift,

    userShiftId,

    assignmentId,

    assignmentSource: resolved.source,

    startsAt: window.startsAt,

    endsAt: window.endsAt,
  };
}
