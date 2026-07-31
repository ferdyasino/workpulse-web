import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "../../types/database.ts";

import type {
  AttendanceSession,
  AttendanceState,
  AttendanceStateRequest,
} from "@shared/types/models/attendance.types.ts";

import { getUserContext } from "../users.ts";
import { resolveUserShift } from "../user_shift_resolver.ts";

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

  /*
   * Date used only for selecting assignment/override.
   */
  const lookupDate = payload.date ?? now.toISOString().slice(0, 10);

  const resolved = await resolveUserShift(supabaseAdmin, {
    workspace_id,
    user_id: context.user_id,
    date: lookupDate,
  });

  if (!resolved) {
    return createEmptyState(lookupDate);
  }

  const shift = resolved.shift;

  /*
   * IMPORTANT:
   * assignment_id may be:
   * - user_shifts.id
   * - user_shift_overrides.id
   *
   * user_shift_id is always the FK target for time_logs.
   */
  const userShiftId = resolved.user_shift_id;

  if (!userShiftId) {
    throw new Error(
      "Resolved override does not have a matching user shift assignment.",
    );
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
    .eq("user_shift_id", userShiftId)
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

      resolver: {
        source: resolved.source,
        assignment_id: resolved.assignment_id,
        user_shift_id: userShiftId,
      },

      lookupDate,
      workDate,

      shift: {
        id: shift.id,
        name: shift.name,
        timezone: shift.timezone,
        start_time: shift.start_time,
        end_time: shift.end_time,
      },

      logs: logs.length,

      state,
    }),
  );

  return state;
}
