import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../types/database.ts";

type SubmitTimeLogPayload = {
  workspace_id: string;
  user_id: string;
  email: string;
  shift_id?: string;
  action_type: string;

  device_info: string;
  location: unknown;
  location_status: string;
  location_message: string;

  timestamp: string;
};

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export async function createTimeLog(
  supabaseAdmin: SupabaseClient<Database>,
  payload: SubmitTimeLogPayload,
) {
  console.log(
    "SHIFT LOOKUP",
    JSON.stringify({
      user_id: payload.user_id,
      workspace_id: payload.workspace_id,
      shift_id: payload.shift_id,
    }),
  );

  const userShiftQuery = supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("user_id", payload.user_id)
    .eq("workspace_id", payload.workspace_id)
    .eq("is_primary", true)
    .is("deleted_at", null);

  const { data: userShift, error: shiftError } = payload.shift_id
    ? await userShiftQuery.eq("shift_id", payload.shift_id).maybeSingle()
    : await userShiftQuery.maybeSingle();

  if (shiftError) {
    throw shiftError;
  }

  console.log("USER SHIFT RESULT", JSON.stringify(userShift));

  if (!userShift) {
    throw new Error("No active user shift found.");
  }

  const { data, error } = await supabaseAdmin
    .from("time_logs")
    .insert({
      workspace_id: payload.workspace_id,

      user_id: payload.user_id,

      user_shift_id: userShift.id,

      event_type: payload.action_type.toUpperCase(),

      event_time_utc: payload.timestamp,

      client_timestamp: payload.timestamp,

      timezone: "UTC",

      work_date: payload.timestamp.slice(0, 10),

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
