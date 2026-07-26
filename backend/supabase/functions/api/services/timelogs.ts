import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

import type { SubmitTimeLogRequest } from "@shared/types/attendance.types.ts";

import { resolveWorkDate } from "./attendance/workdate.ts";

type Json =
  | string
  | number
  | boolean
  | null
  | {
      [key: string]: Json | undefined;
    }
  | Json[];

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
      attendance_policy_id,
      shifts (
        start_time,
        end_time,
        timezone,
        is_overnight
      )
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

  const shift = Array.isArray(userShift.shifts)
    ? userShift.shifts[0]
    : userShift.shifts;

  if (!shift) {
    throw new Error("Shift configuration missing.");
  }

  const timestamp = new Date(payload.timestamp);

  if (Number.isNaN(timestamp.getTime())) {
    throw new Error("Invalid timestamp.");
  }

  const workDate = resolveWorkDate({
    timestamp,
    shiftStart: shift.start_time,
    shiftEnd: shift.end_time,
    timezone: shift.timezone,
    isOvernight: shift.is_overnight,
  });

  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      workspace_id: payload.workspace_id,
      user_id: payload.user_id,
      user_shift_id: userShift.id,
      event_type: payload.action_type,

      // Always store normalized UTC timestamp
      event_time_utc: timestamp.toISOString(),

      // Keep original client timestamp for audit/display
      client_timestamp: payload.timestamp,

      // Controlled by assigned shift timezone
      timezone: shift.timezone,

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
