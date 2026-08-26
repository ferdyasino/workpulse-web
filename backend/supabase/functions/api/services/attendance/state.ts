import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@shared/types/database.ts";

import type {
  AttendanceSession,
  AttendanceState,
  AttendanceStateContext,
} from "@shared/types/models/attendance.types.ts";

import { getUserContext } from "../users.ts";

import {
  buildAttendanceSessions,
  getCurrentAttendanceSession,
  getLatestAttendanceSession,
} from "./sessions.ts";

import { resolveAttendanceContext } from "../context.ts";

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
   * No active session means the latest event cannot currently
   * be represented as working.
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
   * Active break takes priority.
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
   * Then lunch.
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
   * Otherwise actively working.
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
  const {
    workspace_id,
    authUserId,
    email,
    authProvider,
    date,
    timestamp,
    shift_id,
  } = payload;

  /*
   * ------------------------------------------------------------------------
   * Resolve authenticated application user
   * ------------------------------------------------------------------------
   */
  const context = await getUserContext(
    supabaseAdmin,
    authUserId,
    email,
    authProvider ?? null,
  );

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
   * ------------------------------------------------------------------------
   * Resolve ONE authoritative attendance context
   * ------------------------------------------------------------------------
   */
  const attendanceContext = await resolveAttendanceContext({
    supabaseAdmin,

    workspaceId: workspace_id,

    userId,

    timestamp: now,

    requestedShiftId: shift_id ?? null,

    requestedWorkDate: date ?? null,
  });

  /*
   * No assignment means employee has no attendance context.
   *
   * If an explicit date was requested, preserve that date.
   * Otherwise use the UTC date as a safe fallback for an empty state.
   */
  if (!attendanceContext) {
    const fallbackDate = date ?? now.toISOString().slice(0, 10);

    return createEmptyState(fallbackDate);
  }

  const {
    workDate,
    shift,
    userShiftId,
    assignmentId,
    assignmentSource,
    startsAt,
    endsAt,
  } = attendanceContext;

  /*
   * ------------------------------------------------------------------------
   * Retrieve attendance events
   * ------------------------------------------------------------------------
   *
   * user_shift_id references the permanent user_shifts row.
   *
   * work_date comes from the authoritative attendance context.
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
   * Active session is used by validation.
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

      context: {
        work_date: workDate,

        timezone: attendanceContext.timezone,

        starts_at: startsAt.toISOString(),

        ends_at: endsAt.toISOString(),

        assignment_source: assignmentSource,

        assignment_id: assignmentId,

        user_shift_id: userShiftId,
      },

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
