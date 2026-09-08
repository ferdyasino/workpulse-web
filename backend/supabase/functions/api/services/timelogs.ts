import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/models/attendance.types.ts";

import { resolveAttendanceContext } from "./context.ts";
import { getUserContext } from "./users.ts";

/* -------------------------------------------------------------------------- */
/* Workspace Membership                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Attendance requires an actual workspace membership.
 *
 * Platform Owner access is global, but that does NOT automatically make the
 * Platform Owner an employee/member of every workspace for attendance.
 *
 * This check is intentionally separate from administrative workspace access.
 */
async function assertAttendanceWorkspaceMembership(
  supabaseAdmin: SupabaseClient<Database>,
  userId: string,
  workspaceId: string,
): Promise<void> {
  if (!userId) {
    throw new Error("User ID is required.");
  }

  if (!workspaceId) {
    throw new Error("Workspace ID is required.");
  }

  const { data: membership, error } = await supabaseAdmin
    .from("workspace_members")
    .select("id, workspace_id, user_id, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!membership) {
    throw new Error("User does not belong to this workspace.");
  }

  if (
    membership.workspace_id !== workspaceId ||
    membership.user_id !== userId
  ) {
    throw new Error("User does not belong to this workspace.");
  }
}

/* -------------------------------------------------------------------------- */
/* Create Time Log                                                            */
/* -------------------------------------------------------------------------- */

export async function createTimeLog(
  supabaseAdmin: SupabaseClient<Database>,
  authUserId: string,
  payload: SubmitTimeLogRequest,
  authEmail: string | null = null,
  authProvider: string | null = null,
) {
  console.log(
    "TIMELOG CREATE",
    JSON.stringify({
      authenticated_user_id: authUserId,

      workspace_id: payload.workspace_id,

      action_type: payload.action_type,

      shift_id: payload.shift_id ?? null,
    }),
  );

  if (!authUserId) {
    throw new Error("Authenticated user ID is required.");
  }

  if (!payload.workspace_id) {
    throw new Error("Workspace ID is required.");
  }

  /*
   * ------------------------------------------------------------------------
   * Resolve authenticated application user
   * ------------------------------------------------------------------------
   *
   * The selected workspace is explicitly passed to getUserContext().
   *
   * For Platform Owner this resolves the real public.users record when
   * available, but does not by itself grant attendance access.
   */
  const context = await getUserContext(
    supabaseAdmin,
    authUserId,
    authEmail ?? "",
    authProvider,
    payload.workspace_id,
  );

  const userId = context.user_id;

  if (!userId) {
    throw new Error("User context does not contain a user ID.");
  }

  /*
   * ------------------------------------------------------------------------
   * Attendance workspace authorization
   * ------------------------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Platform Owner can administer any workspace, but attendance is only
   * allowed when the authenticated application user has an ACTIVE
   * workspace_members record for the selected workspace.
   *
   * This prevents:
   *
   *   Platform Owner → switch workspace → TIME_IN
   *
   * unless the Platform Owner is actually assigned to that workspace.
   */
  await assertAttendanceWorkspaceMembership(
    supabaseAdmin,
    userId,
    payload.workspace_id,
  );

  /*
   * getUserContext() should already resolve the selected workspace for
   * workspace-aware requests. Keep this additional check as a defensive
   * authorization boundary.
   */
  if (context.workspace_id !== payload.workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  /*
   * ------------------------------------------------------------------------
   * Parse timestamp
   * ------------------------------------------------------------------------
   */
  const timestamp = new Date(payload.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid timestamp.");
  }

  /*
   * ------------------------------------------------------------------------
   * Resolve ONE authoritative attendance context
   * ------------------------------------------------------------------------
   *
   * This is intentionally the same resolver used by
   * ATTENDANCE_STATE_GET.
   */
  const attendanceContext = await resolveAttendanceContext({
    supabaseAdmin,

    workspaceId: payload.workspace_id,

    userId,

    timestamp,

    requestedShiftId: payload.shift_id ?? null,
  });

  /*
   * Membership exists, but there is no effective shift assignment.
   */
  if (!attendanceContext) {
    throw new Error("No active user shift found.");
  }

  const {
    workDate,
    timezone,
    shift,
    userShiftId,
    assignmentId,
    assignmentSource,
    startsAt,
    endsAt,
  } = attendanceContext;

  /*
   * ------------------------------------------------------------------------
   * Immutable attendance event
   * ------------------------------------------------------------------------
   */
  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      workspace_id: payload.workspace_id,

      /*
       * Application user ID.
       */
      user_id: userId,

      /*
       * Permanent user_shifts FK.
       */
      user_shift_id: userShiftId,

      event_type: payload.action_type,

      /*
       * Normalize timestamp to UTC.
       */
      event_time_utc: timestamp.toISOString(),

      /*
       * Preserve original client timestamp.
       */
      client_timestamp: payload.timestamp,

      /*
       * Store the timezone used by the effective shift.
       */
      timezone,

      /*
       * Authoritative shift-aware work date.
       */
      work_date: workDate,

      /*
       * Unique event identifier.
       */
      log_no: crypto.randomUUID(),

      metadata: {
        device_info: payload.device_info,

        location: JSON.stringify(payload.location),

        location_status: payload.location_status,

        location_message: payload.location_message,

        /*
         * Attendance resolution audit data.
         */
        assignment_id: assignmentId,

        assignment_source: assignmentSource,

        shift_id: shift.id,

        shift_start: startsAt.toISOString(),

        shift_end: endsAt.toISOString(),
      } satisfies Json,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  console.log(
    "TIMELOG CREATED",
    JSON.stringify({
      id: data.id,

      authenticated_user_id: authUserId,

      user_id: userId,

      user_shift_id: userShiftId,

      workspace_id: payload.workspace_id,

      event_type: payload.action_type,

      event_time_utc: data.event_time_utc,

      work_date: data.work_date,

      timezone: data.timezone,

      shift_id: shift.id,

      assignment_id: assignmentId,

      assignment_source: assignmentSource,
    }),
  );

  return data;
}

/* -------------------------------------------------------------------------- */
/* Get Time Logs                                                              */
/* -------------------------------------------------------------------------- */

export async function getTimelogs(
  supabaseAdmin: SupabaseClient<Database>,
  params: {
    workspace_id: string;
    user_id?: string;
    work_date?: string;
  },
) {
  console.log("TIMELOG LIST", JSON.stringify(params));

  let query = supabaseAdmin
    .from("time_logs")
    .select(
      `
      id,
      event_type,
      event_time_utc,
      client_timestamp,
      timezone,
      work_date,
      metadata,
      user_shift_id,
      user_id,
      users (
        display_name,
        email
      )
    `,
    )
    .eq("workspace_id", params.workspace_id)
    .order("event_time_utc", {
      ascending: false,
    });

  if (params.user_id) {
    query = query.eq("user_id", params.user_id);
  }

  if (params.work_date) {
    query = query.eq("work_date", params.work_date);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}
