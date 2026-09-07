import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/models/attendance.types.ts";

import { getApplicationContext, resolveAttendanceContext } from "./context.ts";

/* -------------------------------------------------------------------------- */
/* Platform Owner                                                             */
/* -------------------------------------------------------------------------- */

/*
 * Platform Owner does not belong to a workspace and does not have a
 * user_shift assignment.
 *
 * The Platform Owner timezone is fixed because there is no workspace/shift
 * timezone available.
 *
 * event_time_utc is always stored as UTC.
 */
const PLATFORM_OWNER_TIMEZONE = "America/New_York";

const platformOwnerEmail = Deno.env
  .get("PLATFORM_OWNER_EMAIL")
  ?.trim()
  .toLowerCase();

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function isPlatformOwnerEmail(email: string | null | undefined): boolean {
  if (!platformOwnerEmail || !email) {
    return false;
  }

  return email.trim().toLowerCase() === platformOwnerEmail;
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
      workspace_id: payload.workspace_id ?? null,
      action_type: payload.action_type,
      shift_id: payload.shift_id ?? null,
    }),
  );

  if (!authUserId) {
    throw new Error("Authenticated user ID is required.");
  }

  /*
   * ------------------------------------------------------------------------
   * Resolve application context
   * ------------------------------------------------------------------------
   *
   * Platform Owner:
   *
   *   user_id      = authenticated user's UUID
   *   workspace_id = null
   *   shift        = null
   *
   * Normal user:
   *
   *   user_id      = public.users.id
   *   workspace_id = user's workspace
   *   shift        = resolved user shift
   */
  const context = await getApplicationContext(
    supabaseAdmin,
    authUserId,
    authEmail,
    authProvider,
  );

  /*
   * IMPORTANT:
   *
   * Do NOT inspect context.user.meta here.
   *
   * context.user.meta is typed as Json and therefore can be a string,
   * number, boolean, array, null, or object.
   *
   * Platform Owner identity is determined exclusively by
   * PLATFORM_OWNER_EMAIL.
   */
  const isPlatformOwner = isPlatformOwnerEmail(authEmail);

  /*
   * Supabase Auth UUID and public.users.id are the same UUID.
   */
  const userId = isPlatformOwner ? authUserId : context.user.user_id;

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

  /* ------------------------------------------------------------------------ */
  /* Platform Owner                                                           */
  /* ------------------------------------------------------------------------ */

  if (isPlatformOwner) {
    /*
     * Platform Owner is completely independent of workspace attendance.
     *
     * Therefore:
     *
     *   workspace_id  = NULL
     *   user_shift_id = NULL
     *   user_id       = authUserId
     */
    const timezone = PLATFORM_OWNER_TIMEZONE;

    /*
     * Calculate the calendar date using the Platform Owner timezone.
     *
     * The actual event timestamp remains UTC.
     */
    const workDate = getLocalCalendarDate(timestamp, timezone);

    const { data, error } = await supabaseAdmin
      .from("time_logs")
      .insert({
        /*
         * Platform Owner has no workspace.
         */
        workspace_id: null,

        /*
         * Auth UUID is the same UUID used by public.users.id.
         */
        user_id: authUserId,

        /*
         * Platform Owner has no user_shift.
         */
        user_shift_id: null,

        event_type: payload.action_type,

        /*
         * Always store the absolute event timestamp in UTC.
         */
        event_time_utc: timestamp.toISOString(),

        /*
         * Preserve the original client timestamp.
         */
        client_timestamp: payload.timestamp,

        /*
         * Timezone used for work_date calculation.
         */
        timezone,

        /*
         * Local calendar date in America/New_York.
         */
        work_date: workDate,

        /*
         * Unique time-log identifier.
         */
        log_no: crypto.randomUUID(),

        metadata: {
          device_info: payload.device_info,

          location: JSON.stringify(payload.location),

          location_status: payload.location_status,

          location_message: payload.location_message,

          /*
           * Audit information.
           */
          platform_owner: true,

          assignment_id: null,

          assignment_source: null,

          shift_id: null,

          shift_start: null,

          shift_end: null,
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
        user_id: authUserId,
        user_shift_id: null,
        workspace_id: null,
        event_type: payload.action_type,
        event_time_utc: data.event_time_utc,
        work_date: data.work_date,
        timezone: data.timezone,
        platform_owner: true,
      }),
    );

    return data;
  }

  /* ------------------------------------------------------------------------ */
  /* Normal Workspace User                                                    */
  /* ------------------------------------------------------------------------ */

  if (!context.user.workspace_id) {
    throw new Error("User workspace_id is missing.");
  }

  /*
   * Make sure the requested workspace belongs to the authenticated user.
   */
  if (context.user.workspace_id !== payload.workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  /*
   * ------------------------------------------------------------------------
   * Resolve authoritative attendance context
   * ------------------------------------------------------------------------
   *
   * The same attendance resolver is used by the attendance state logic.
   *
   * This provides:
   *
   *   - effective shift
   *   - user_shift_id
   *   - assignment_id
   *   - assignment source
   *   - shift timezone
   *   - work date
   *   - shift start
   *   - shift end
   */
  const attendanceContext = await resolveAttendanceContext({
    supabaseAdmin,
    workspaceId: context.user.workspace_id,
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
   * Create immutable attendance event
   * ------------------------------------------------------------------------
   */
  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      /*
       * Normal users always belong to a workspace.
       */
      workspace_id: context.user.workspace_id,

      /*
       * Application user ID.
       */
      user_id: userId,

      /*
       * Resolved permanent user_shift assignment.
       */
      user_shift_id: userShiftId,

      event_type: payload.action_type,

      /*
       * Normalize the absolute timestamp to UTC.
       */
      event_time_utc: timestamp.toISOString(),

      /*
       * Preserve the original client timestamp.
       */
      client_timestamp: payload.timestamp,

      /*
       * Effective shift timezone.
       */
      timezone,

      /*
       * Authoritative shift-aware work date.
       */
      work_date: workDate,

      /*
       * Unique time-log identifier.
       */
      log_no: crypto.randomUUID(),

      metadata: {
        device_info: payload.device_info,

        location: JSON.stringify(payload.location),

        location_status: payload.location_status,

        location_message: payload.location_message,

        /*
         * Attendance resolution audit information.
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
      workspace_id: context.user.workspace_id,
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
    workspace_id: string | null;
    user_id?: string;
    work_date?: string;
  },
) {
  console.log("TIMELOG LIST", JSON.stringify(params));

  let query = supabaseAdmin
    .from("time_logs")
    .select(
      `;
(id,
  event_type,
  event_time_utc,
  client_timestamp,
  timezone,
  work_date,
  metadata,
  user_shift_id,
  user_id,
  workspace_id,
  users(display_name, email)`,
    )
    .order("event_time_utc", {
      ascending: false,
    });

  /*
   * ------------------------------------------------------------------------
   * Workspace scope
   * ------------------------------------------------------------------------
   *
   * Normal user:
   *
   *   workspace_id = actual workspace UUID
   *
   * Platform Owner:
   *
   *   workspace_id IS NULL
   */
  if (params.workspace_id) {
    query = query.eq("workspace_id", params.workspace_id);
  } else {
    query = query.is("workspace_id", null);
  }

  /*
   * ------------------------------------------------------------------------
   * User scope
   * ------------------------------------------------------------------------
   */
  if (params.user_id) {
    query = query.eq("user_id", params.user_id);
  }

  /*
   * ------------------------------------------------------------------------
   * Work date
   * ------------------------------------------------------------------------
   */
  if (params.work_date) {
    query = query.eq("work_date", params.work_date);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}
