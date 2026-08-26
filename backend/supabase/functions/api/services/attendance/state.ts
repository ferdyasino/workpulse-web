import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import type {
  AttendanceSession,
  AttendanceState,
  AttendanceStateContext,
} from "@shared/types/models/attendance.types.ts";

import { getUserContext } from "../users.ts";
import { resolveUserShift } from "../user_shift_resolver.ts";

import {
  buildAttendanceSessions,
  getCurrentAttendanceSession,
  getLatestAttendanceSession,
} from "./sessions.ts";

import { resolveWorkDate } from "./workdate.ts";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Attendance State                                                           */
/* -------------------------------------------------------------------------- */

export function buildAttendanceState(
  workDate: string,
  shift: AttendanceState["shift"],
  sessions: AttendanceSession[],
  currentSession: AttendanceSession | null,
): AttendanceState {
  /*
   * The latest session is used to determine the employee's displayed
   * attendance state.
   *
   * The active session is separately used by validation.
   */
  const latestSession = getLatestAttendanceSession(sessions);

  if (!latestSession || !latestSession.time_in) {
    return createEmptyState(workDate, shift);
  }

  /*
   * A completed latest session means the employee is clocked out.
   */
  if (latestSession.time_out) {
    return {
      status: "CLOCKED_OUT",
      work_date: workDate,
      shift,
      sessions,
      current_session: latestSession,
    };
  }

  /*
   * No TIME_OUT means this is an active session.
   */
  if (!currentSession) {
    return {
      status: "OFF",
      work_date: workDate,
      shift,
      sessions,
      current_session: null,
    };
  }

  /*
   * Check active break first.
   */
  const activeBreak = currentSession.breaks.at(-1);

  if (activeBreak && !activeBreak.out) {
    return {
      status: "BREAK",
      work_date: workDate,
      shift,
      sessions,
      current_session: currentSession,
    };
  }

  /*
   * Then check lunch.
   */
  if (currentSession.lunch.in && !currentSession.lunch.out) {
    return {
      status: "LUNCH",
      work_date: workDate,
      shift,
      sessions,
      current_session: currentSession,
    };
  }

  /*
   * Otherwise employee is actively working.
   */
  return {
    status: "WORKING",
    work_date: workDate,
    shift,
    sessions,
    current_session: currentSession,
  };
}

/* -------------------------------------------------------------------------- */
/* Get Current Attendance State                                               */
/* -------------------------------------------------------------------------- */

export async function getCurrentAttendanceState(
  supabaseAdmin: SupabaseClient<Database>,
  payload: AttendanceStateContext,
): Promise<AttendanceState> {
  const { workspace_id, authUserId, email, authProvider, date, timestamp } =
    payload;

  /*
   * Resolve the authenticated identity to the application user.
   */
  const context = await getUserContext(
    supabaseAdmin,
    authUserId,
    email,
    authProvider ?? null,
  );

  /*
   * Prevent cross-workspace attendance access.
   */
  if (context.workspace_id !== workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  const userId = context.user_id;

  if (!userId) {
    throw new Error("User context does not contain a user ID.");
  }

  /*
   * Timestamp represents an absolute instant.
   */
  const now = timestamp ? new Date(timestamp) : new Date();

  if (Number.isNaN(now.getTime())) {
    throw new Error("Invalid attendance timestamp.");
  }

  /*
   * We need a date for resolving the effective assignment.
   *
   * When an explicit date is supplied, it is authoritative.
   *
   * Otherwise use the server/client instant's calendar date as the
   * initial assignment lookup date. The final work_date is resolved
   * using the effective shift timezone below.
   */
  const lookupDate = date ?? now.toISOString().slice(0, 10);

  /*
   * Resolve effective shift.
   *
   * Priority:
   *
   * 1. user_shift_overrides
   * 2. user_shifts
   */
  const resolved = await resolveUserShift(supabaseAdmin, {
    workspace_id,
    user_id: userId,
    date: lookupDate,
  });

  if (!resolved) {
    return createEmptyState(lookupDate);
  }

  const shift = resolved.shift;

  if (!shift) {
    throw new Error("Resolved user shift does not contain a shift.");
  }

  /*
   * Attendance logs always reference user_shifts.id.
   *
   * Even when the effective shift came from an override,
   * resolved.user_shift_id must point to the permanent assignment.
   */
  const userShiftId = resolved.user_shift_id;

  if (!userShiftId) {
    throw new Error(
      "Resolved shift does not have a matching user shift assignment.",
    );
  }

  /*
   * Shift timezone is authoritative.
   */
  const timezone = shift.timezone;

  /*
   * Explicit date is used as-is.
   *
   * Otherwise resolve work_date from the timestamp and shift.
   */
  const workDate =
    date ??
    resolveWorkDate({
      timestamp: now,
      shiftStart: shift.start_time,
      shiftEnd: shift.end_time,
      isOvernight: shift.is_overnight,
      timezone,
    });

  /*
   * Retrieve only logs belonging to the authenticated application user,
   * workspace, permanent user_shift assignment, and work date.
   */
  const { data: logs, error: logsError } = await supabaseAdmin
    .from("time_logs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .eq("user_id", userId)
    .eq("user_shift_id", userShiftId)
    .eq("work_date", workDate)
    .order("event_time_utc", {
      ascending: true,
    });

  if (logsError) {
    throw logsError;
  }

  /*
   * Convert immutable events into logical sessions.
   */
  const sessions = logs.length > 0 ? buildAttendanceSessions(logs) : [];

  /*
   * Active session is used by action validation.
   */
  const currentSession = getCurrentAttendanceSession(sessions);

  /*
   * Build client-facing state.
   */
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
        is_overnight: shift.is_overnight,
      },

      logs: logs.length,

      state,
    }),
  );

  return state;
}
