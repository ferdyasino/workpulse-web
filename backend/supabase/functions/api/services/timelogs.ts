import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json, Database } from "@shared/types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/models/attendance.types.ts";

import { resolveWorkDate } from "./attendance/workdate.ts";
import { resolveUserShift } from "./user_shift_resolver.ts";
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
   * Resolve Supabase Auth identity to the application's users.id.
   *
   * This is important because:
   *
   * auth.users.id
   *
   * and
   *
   * public.users.id
   *
   * must not be assumed to be the same unless the schema explicitly
   * guarantees that relationship.
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
   * Parse the submitted timestamp.
   */
  const timestamp = new Date(payload.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid timestamp.");
  }

  /*
   * Initial assignment lookup date.
   *
   * The final attendance work_date is resolved using the effective
   * shift timezone.
   */
  const lookupDate = timestamp.toISOString().slice(0, 10);

  /*
   * Resolve effective shift.
   */
  const assignment = await resolveUserShift(supabaseAdmin, {
    workspace_id: payload.workspace_id,
    user_id: userId,
    date: lookupDate,
  });

  if (!assignment) {
    throw new Error("No active user shift found.");
  }

  const shift = assignment.shift;

  if (!shift) {
    throw new Error("Resolved user shift does not contain a shift.");
  }

  /*
   * If the client supplied a shift_id, it must match the server-resolved
   * effective shift.
   */
  if (payload.shift_id && payload.shift_id !== shift.id) {
    throw new Error(
      "The requested shift does not match the user's effective shift.",
    );
  }

  /*
   * time_logs.user_shift_id MUST reference user_shifts.id.
   *
   * When an override is active:
   *
   * assignment.assignment_id = override.id
   * assignment.user_shift_id = permanent user_shifts.id
   */
  const userShiftId = assignment.user_shift_id;

  if (!userShiftId) {
    throw new Error(
      "Resolved shift does not have a matching user shift assignment.",
    );
  }

  /*
   * Resolve work_date using the effective shift's timezone.
   */
  const workDate = resolveWorkDate({
    timestamp,
    shiftStart: shift.start_time,
    shiftEnd: shift.end_time,
    timezone: shift.timezone,
    isOvernight: shift.is_overnight,
  });

  /*
   * Immutable attendance event.
   */
  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      workspace_id: payload.workspace_id,

      /*
       * Application user ID, NOT blindly the Supabase Auth ID.
       */
      user_id: userId,

      /*
       * Permanent user_shift FK.
       */
      user_shift_id: userShiftId,

      event_type: payload.action_type,

      /*
       * Normalize timestamp to UTC.
       */
      event_time_utc: timestamp.toISOString(),

      /*
       * Preserve original client timestamp for auditing.
       */
      client_timestamp: payload.timestamp,

      /*
       * Store the timezone used to resolve the attendance event.
       */
      timezone: shift.timezone,

      /*
       * Shift-aware work date.
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
