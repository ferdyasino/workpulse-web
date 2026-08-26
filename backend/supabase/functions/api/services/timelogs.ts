import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/models/attendance.types.ts";

import { resolveAttendanceContext } from "./context.ts";
import { getUserContext } from "./users.ts";

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

  /*
   * ------------------------------------------------------------------------
   * Resolve authenticated application user
   * ------------------------------------------------------------------------
   */
  const context = await getUserContext(
    supabaseAdmin,
    authUserId,
    authEmail ?? "",
    authProvider,
  );

  if (context.workspace_id !== payload.workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  const userId = context.user_id;

  if (!userId) {
    throw new Error("User context does not contain a user ID.");
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
