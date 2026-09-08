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

export function getPlatformOwnerContext(
  authUserId: string,
  authEmail: string | null,
) {
  if (!isPlatformOwnerEmail(authEmail)) {
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
  /*
   * ------------------------------------------------------------------------ *
   * Explicit workspace selected
   * ------------------------------------------------------------------------ *
   *
   * Validate that the authenticated user actually belongs to the requested
   * workspace and that the membership is active.
   */
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

    if (membership.status !== "active") {
      throw new Error("User workspace membership is not active.");
    }

    return {
      workspaceId: membership.workspace_id,
      membership,
    };
  }

  /*
   * ------------------------------------------------------------------------ *
   * No workspace explicitly selected
   * ------------------------------------------------------------------------ *
   *
   * Find all active memberships.
   */
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
    .eq("status", "active")
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
    .single();

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

export async function getApplicationContext(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  authEmail: string | null,
  authProvider: string | null,
  workspace_id: string | null = null,
) {
  /*
   * ------------------------------------------------------------------------ *
   * Check Platform Owner FIRST
   * ------------------------------------------------------------------------ *
   *
   * Platform Owner is identified by PLATFORM_OWNER_EMAIL.
   *
   * Platform Owner:
   *
   *   - does not require workspace_members
   *   - does not require users.workspace_id
   *   - may have a public.users record
   *   - may not have a public.users record
   *   - may authenticate before selecting a workspace
   *   - may explicitly select any active workspace
   */
  if (isPlatformOwnerEmail(authEmail)) {
    /*
     * Check whether a real WorkPulse user record exists.
     *
     * This is NOT an authorization check.
     *
     * It only determines whether we should use the real users.id.
     */
    const { data: existingUser, error: existingUserError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("id", authUserId)
      .is("deleted_at", null)
      .maybeSingle();

    if (existingUserError) {
      throw existingUserError;
    }

    /*
     * ---------------------------------------------------------------------- *
     * Platform Owner without public.users record
     * ---------------------------------------------------------------------- *
     *
     * Login is allowed globally.
     *
     * If no workspace is selected, return the global Platform Owner context.
     */
    if (!existingUser) {
      if (!workspace_id) {
        return getPlatformOwnerContext(authUserId, authEmail);
      }

      /*
       * Platform Owner can select any active workspace.
       */
      const workspace = await resolvePlatformOwnerWorkspace(
        supabaseAdmin,
        workspace_id,
      );

      const platformContext = getPlatformOwnerContext(authUserId, authEmail);

      return {
        user: {
          ...platformContext.user,
          workspace_id: workspace.id,
        },

        workspace,
      };
    }

    /*
     * ---------------------------------------------------------------------- *
     * Platform Owner with public.users record
     * ---------------------------------------------------------------------- *
     *
     * Always resolve the real WorkPulse user identity.
     */
    const userContext = await getUserContext(
      supabaseAdmin,
      authUserId,
      authEmail,
      authProvider,
      null,
    );

    if (!userContext.user_id) {
      throw new Error("User WorkPulse record is missing.");
    }

    /*
     * No workspace selected.
     *
     * Return global Platform Owner context.
     */
    if (!workspace_id) {
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
            platform_owner: true,
          },
        },

        workspace: null,
      };
    }

    /*
     * ---------------------------------------------------------------------- *
     * Platform Owner with selected workspace
     * ---------------------------------------------------------------------- *
     *
     * Platform Owner may administer the selected workspace even without a
     * workspace_members record.
     *
     * Attendance authorization is intentionally handled separately and
     * must still require actual membership.
     */
    const workspace = await resolvePlatformOwnerWorkspace(
      supabaseAdmin,
      workspace_id,
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
          platform_owner: true,
        },
      },

      workspace,
    };
  }

  /*
   * ------------------------------------------------------------------------ *
   * Normal WorkPulse User
   * ------------------------------------------------------------------------ *
   *
   * The authenticated Supabase Auth ID is authoritative.
   *
   * public.users.id must correspond to auth.users.id.
   */
  const { data: existingUser, error: existingUserError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", authUserId)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingUserError) {
    throw existingUserError;
  }

  if (!existingUser) {
    throw new Error("User account is not registered in WorkPulse.");
  }

  /*
   * ------------------------------------------------------------------------ *
   * Resolve Workspace
   * ------------------------------------------------------------------------ *
   *
   * If workspace_id was supplied, validate that membership.
   *
   * If workspace_id was not supplied:
   *
   *   - one active workspace -> automatically select it
   *   - multiple active workspaces -> require explicit selection
   */
  const resolvedWorkspace = await resolveNormalUserWorkspace(
    supabaseAdmin,
    authUserId,
    workspace_id,
  );

  const workspaceId = resolvedWorkspace.workspaceId;

  if (!workspaceId) {
    throw new Error("User workspace could not be resolved.");
  }

  /*
   * ------------------------------------------------------------------------ *
   * Resolve Workspace-Specific User Context
   * ------------------------------------------------------------------------ *
   *
   * getUserContext() receives the authoritative workspace ID.
   */
  const userContext = await getUserContext(
    supabaseAdmin,
    authUserId,
    authEmail,
    authProvider,
    workspaceId,
  );

  if (!userContext.workspace_id) {
    throw new Error("User workspace could not be resolved.");
  }

  if (!userContext.user_id) {
    throw new Error("User WorkPulse record is missing.");
  }

  /*
   * ------------------------------------------------------------------------ *
   * Workspace
   * ------------------------------------------------------------------------ *
   */

  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from("workspaces")
    .select("*")
    .eq("id", userContext.workspace_id)
    .is("deleted_at", null)
    .single();

  if (workspaceError) {
    throw workspaceError;
  }

  if (!workspace) {
    throw new Error("User workspace not found.");
  }

  /*
   * ------------------------------------------------------------------------ *
   * Return Application Context
   * ------------------------------------------------------------------------ *
   */

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
/* Helpers                                                                    */
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
  /* Initial assignment lookup                                                */
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
  /* Determine effective shift timezone                                       */
  /* ------------------------------------------------------------------------ */

  const firstShift = resolved.shift;

  const timezone = firstShift.timezone;

  /* ------------------------------------------------------------------------ */
  /* Resolve local calendar date                                              */
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
  /* Validate requested shift                                                 */
  /* ------------------------------------------------------------------------ */

  if (requestedShiftId && requestedShiftId !== shift.id) {
    throw new Error(
      "The requested shift does not match the user's effective shift.",
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Permanent user_shift reference                                           */
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
  /* Resolve actual work window                                               */
  /* ------------------------------------------------------------------------ */

  const window = resolveWorkWindow({
    timestamp,
    shiftStart: shift.start_time,
    shiftEnd: shift.end_time,
    isOvernight: shift.is_overnight,
    timezone: shift.timezone,
  });

  /* ------------------------------------------------------------------------ */
  /* Return authoritative attendance context                                  */
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
