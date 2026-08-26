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

  const userContext = await getUserContext(
    supabaseAdmin,
    authUserId,
    authEmail,
    authProvider,
  );

  if (!userContext.workspace_id) {
    throw new Error("User workspace_id is missing");
  }

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
