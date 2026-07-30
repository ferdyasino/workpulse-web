import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.ts";

import type {
  AttendanceSession,
  AttendanceState,
  AttendanceStateRequest,
} from "@shared/types/attendance.types.ts";

import { getUserContext } from "../users.ts";

import {
  buildAttendanceSessions,
  getCurrentAttendanceSession,
} from "./sessions.ts";

import { resolveWorkDate } from "./workdate.ts";

function createEmptyState(
  workDate: string,
  shift: AttendanceState["shift"] = null,
): AttendanceState {
  return {
    status: "OFF",
    work_date: workDate,
    shift,
    sessions: [],
    current_session: null,
  };
}

export function buildAttendanceState(
  workDate: string,
  shift: AttendanceState["shift"],
  sessions: AttendanceSession[],
  currentSession: AttendanceSession | null,
): AttendanceState {
  if (!currentSession || !currentSession.time_in) {
    return createEmptyState(workDate, shift);
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
    shift,
    sessions,
    current_session: currentSession,
  };
}

export async function getCurrentAttendanceState(
  supabaseAdmin: SupabaseClient<Database>,
  payload: AttendanceStateRequest,
): Promise<AttendanceState> {
  const { workspace_id, email } = payload;

  const context = await getUserContext(supabaseAdmin, email);

  if (context.workspace_id !== workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  const now = payload.timestamp ? new Date(payload.timestamp) : new Date();

  if (!context.shift) {
    const workDate = payload.date ?? now.toISOString().slice(0, 10);

    return createEmptyState(workDate);
  }

  const shift = context.shift;

  const today = now.toISOString().slice(0, 10);

  const { data: assignment, error: assignmentError } = await supabaseAdmin
    .from("user_shifts")
    .select("id")
    .eq("workspace_id", workspace_id)
    .eq("user_id", context.user_id)
    .eq("shift_id", shift.id)
    .is("deleted_at", null)
    .lte("effective_from", today)
    .or(`effective_to.is.null,effective_to.gte.${today}`)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (assignmentError) {
    throw assignmentError;
  }

  if (!assignment) {
    throw new Error("Active shift assignment not found.");
  }

  const timezone = shift.timezone;

  const workDate =
    payload.date ??
    resolveWorkDate({
      timestamp: now,
      shiftStart: shift.start_time,
      shiftEnd: shift.end_time,
      isOvernight: shift.is_overnight,
      timezone,
    });

  const { data: logs, error: logsError } = await supabaseAdmin
    .from("time_logs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("user_id", context.user_id)
    .eq("user_shift_id", assignment.id)
    .eq("work_date", workDate)
    .order("event_time_utc");

  if (logsError) {
    throw logsError;
  }

  const sessions = logs.length > 0 ? buildAttendanceSessions(logs) : [];

  const currentSession = getCurrentAttendanceSession(sessions);

  const state = buildAttendanceState(workDate, shift, sessions, currentSession);

  console.log(
    "ATTENDANCE STATE",
    JSON.stringify({
      email,
      timestamp: now.toISOString(),
      workDate,
      shift,
      assignment: assignment.id,
      timezone,
      logs: logs.length,
      state,
    }),
  );

  return state;
}
