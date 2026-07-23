import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.ts";

import type {
  AttendanceSession,
  AttendanceState,
  AttendanceStateRequest,
} from "@shared/types/attendance.types.ts";

import {
  buildAttendanceSessions,
  getCurrentAttendanceSession,
} from "./sessions.ts";

function createEmptyState(workDate: string): AttendanceState {
  return {
    status: "OFF",

    work_date: workDate,

    sessions: [],

    current_session: null,
  };
}

export function buildAttendanceState(
  workDate: string,
  sessions: AttendanceSession[],
  currentSession: AttendanceSession | null,
): AttendanceState {
  if (!currentSession || !currentSession.time_in) {
    return createEmptyState(workDate);
  }

  let status: AttendanceState["status"];

  if (currentSession.time_out) {
    status = "CLOCKED_OUT";
  } else {
    const activeBreak = currentSession.breaks.at(-1);

    if (activeBreak && !activeBreak.out) {
      status = "BREAK";
    } else if (currentSession.lunch.in && !currentSession.lunch.out) {
      status = "LUNCH";
    } else {
      status = "WORKING";
    }
  }

  return {
    status,

    work_date: workDate,

    sessions,

    current_session: currentSession,
  };
}

export async function getCurrentAttendanceState(
  supabaseAdmin: SupabaseClient<Database>,
  payload: AttendanceStateRequest,
): Promise<AttendanceState> {
  const { workspace_id, email, shift_id } = payload;

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("User not found.");
  }

  let shiftQuery = supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .eq("is_primary", true)
    .is("deleted_at", null);

  if (shift_id) {
    shiftQuery = shiftQuery.eq("shift_id", shift_id);
  }

  const { data: userShift, error: shiftError } = await shiftQuery.maybeSingle();

  if (shiftError) {
    throw shiftError;
  }

  const workDate = payload.date ?? new Date().toISOString().slice(0, 10);

  if (!userShift) {
    return createEmptyState(workDate);
  }

  const { data: logs, error: logsError } = await supabaseAdmin
    .from("time_logs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("user_id", user.id)
    .eq("user_shift_id", userShift.id)
    .eq("work_date", workDate)
    .order("event_time_utc");

  if (logsError) {
    throw logsError;
  }

  const sessions = logs.length > 0 ? buildAttendanceSessions(logs) : [];

  const currentSession = getCurrentAttendanceSession(sessions);

  const state = buildAttendanceState(workDate, sessions, currentSession);

  console.log(
    "ATTENDANCE STATE",
    JSON.stringify({
      email,
      workDate,
      logs: logs.length,
      state,
    }),
  );

  return state;
}
