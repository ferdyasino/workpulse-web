import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/attendance.types.ts";

type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
    }
  | Json[];

const DEFAULT_TIMEZONE = "UTC";

export async function createTimeLog(
  supabaseAdmin: SupabaseClient<Database>,
  payload: SubmitTimeLogRequest,
) {
  console.log(
    "TIMELOG CREATE",
    JSON.stringify({
      user_id: payload.user_id,
      workspace_id: payload.workspace_id,
      action_type: payload.action_type,
    }),
  );

  const { data: userShift, error: shiftError } = await supabaseAdmin
    .from("user_shifts")
    .select(
      `
        id,
        shift_id,
        attendance_policy_id
      `,
    )
    .eq("user_id", payload.user_id)
    .eq("workspace_id", payload.workspace_id)
    .eq("is_primary", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (shiftError) {
    throw shiftError;
  }

  if (!userShift) {
    throw new Error("No active user shift found.");
  }

  const workDate = payload.timestamp.slice(0, 10);

  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      workspace_id: payload.workspace_id,

      user_id: payload.user_id,

      user_shift_id: userShift.id,

      event_type: payload.action_type,

      event_time_utc: payload.timestamp,

      client_timestamp: payload.timestamp,

      timezone: DEFAULT_TIMEZONE,

      work_date: workDate,

      log_no: crypto.randomUUID(),

      metadata: {
        device_info: payload.device_info,

        location: JSON.stringify(payload.location),

        location_status: payload.location_status,

        location_message: payload.location_message,
      } as Json,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
