import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@shared/types/database.ts";

import { buildAttendanceSessions } from "./sessions.ts";

import { resolveAttendanceContext } from "../context.ts";

import { getUserContext } from "../users.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type AttendanceReportRequest = {
  workspace_id: string;

  date_from: string;

  date_to: string;

  user_id?: string;

  department_id?: string;

  timezone?: string;
};

export type AttendanceReportRow = {
  user_id: string;

  employee_no: string;

  employee_name: string;

  department: string | null;

  position: string | null;

  shift_name: string | null;

  work_date: string;

  time_in: string | null;

  time_out: string | null;

  break_minutes: number;

  lunch_minutes: number;

  total_break_minutes: number;

  worked_minutes: number;

  late_minutes: number;

  undertime_minutes: number;

  overtime_minutes: number;

  attendance_status: string;

  timezone: string;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function minutesBetween(start: string | null, end: string | null): number {
  if (!start || !end) {
    return 0;
  }

  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();

  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, Math.floor((endMs - startMs) / 60_000));
}

function sumBreakMinutes(
  session: ReturnType<typeof buildAttendanceSessions>[number],
): number {
  return session.breaks.reduce((total, currentBreak) => {
    return total + minutesBetween(currentBreak.in, currentBreak.out);
  }, 0);
}

function lunchMinutes(
  session: ReturnType<typeof buildAttendanceSessions>[number],
): number {
  return minutesBetween(session.lunch.in, session.lunch.out);
}

function getWorkedMinutes(
  session: ReturnType<typeof buildAttendanceSessions>[number],
): number {
  if (!session.time_in || !session.time_out) {
    return 0;
  }

  const elapsed = minutesBetween(session.time_in, session.time_out);

  const breakMinutes = sumBreakMinutes(session);

  const lunch = lunchMinutes(session);

  return Math.max(0, elapsed - breakMinutes - lunch);
}

function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);

  result.setUTCDate(result.getUTCDate() + days);

  return result;
}

function isDateInRange(
  value: string,
  dateFrom: string,
  dateTo: string,
): boolean {
  return value >= dateFrom && value <= dateTo;
}

/* -------------------------------------------------------------------------- */
/* Shift Calculations                                                         */
/* -------------------------------------------------------------------------- */

function getShiftDurationMinutes(startsAt: Date, endsAt: Date): number {
  return Math.max(
    0,
    Math.floor((endsAt.getTime() - startsAt.getTime()) / 60_000),
  );
}

function calculateLateMinutes(timeIn: string | null, startsAt: Date): number {
  if (!timeIn) {
    return 0;
  }

  const actual = new Date(timeIn);

  if (Number.isNaN(actual.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((actual.getTime() - startsAt.getTime()) / 60_000),
  );
}

function calculateOvertimeMinutes(
  timeOut: string | null,
  endsAt: Date,
): number {
  if (!timeOut) {
    return 0;
  }

  const actual = new Date(timeOut);

  if (Number.isNaN(actual.getTime())) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor((actual.getTime() - endsAt.getTime()) / 60_000),
  );
}

function calculateUndertimeMinutes(
  workedMinutes: number,
  scheduledMinutes: number,
): number {
  return Math.max(0, scheduledMinutes - workedMinutes);
}

function getAttendanceStatus(params: {
  timeIn: string | null;

  timeOut: string | null;

  workedMinutes: number;

  lateMinutes: number;

  undertimeMinutes: number;

  overtimeMinutes: number;
}): string {
  const {
    timeIn,
    timeOut,
    workedMinutes,
    lateMinutes,
    undertimeMinutes,
    overtimeMinutes,
  } = params;

  if (!timeIn) {
    return "ABSENT";
  }

  if (!timeOut) {
    return "IN_PROGRESS";
  }

  if (overtimeMinutes > 0) {
    if (lateMinutes > 0) {
      return "LATE_OVERTIME";
    }

    return "OVERTIME";
  }

  if (lateMinutes > 0 && undertimeMinutes > 0) {
    return "LATE_UNDERTIME";
  }

  if (lateMinutes > 0) {
    return "LATE";
  }

  if (undertimeMinutes > 0) {
    return "UNDERTIME";
  }

  if (workedMinutes > 0) {
    return "PRESENT";
  }

  return "ABSENT";
}

/* -------------------------------------------------------------------------- */
/* User / Employee Queries                                                    */
/* -------------------------------------------------------------------------- */

type UserRecord = Tables<"users">;

async function getUsers(
  supabaseAdmin: SupabaseClient<Database>,
  request: AttendanceReportRequest,
): Promise<UserRecord[]> {
  let query = supabaseAdmin
    .from("users")
    .select("*")
    .eq("workspace_id", request.workspace_id);

  if (request.user_id) {
    query = query.eq("id", request.user_id);
  }

  if (request.department_id) {
    query = query.eq("department_id", request.department_id);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

/* -------------------------------------------------------------------------- */
/* Main Report                                                                */
/* -------------------------------------------------------------------------- */

export async function getAttendanceReport(
  supabaseAdmin: SupabaseClient<Database>,
  request: AttendanceReportRequest,
  authUserId: string,
  email: string,
  authProvider: string | null,
): Promise<AttendanceReportRow[]> {
  if (!request.workspace_id) {
    throw new Error("workspace_id is required.");
  }

  if (!request.date_from) {
    throw new Error("date_from is required.");
  }

  if (!request.date_to) {
    throw new Error("date_to is required.");
  }

  if (request.date_from > request.date_to) {
    throw new Error("date_from cannot be later than date_to.");
  }

  /*
   * Verify authenticated user belongs to workspace.
   */
  const authContext = await getUserContext(
    supabaseAdmin,
    authUserId,
    email,
    authProvider,
  );

  if (authContext.workspace_id !== request.workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  const users = await getUsers(supabaseAdmin, request);

  const rows: AttendanceReportRow[] = [];

  /*
   * Process each employee independently.
   *
   * This deliberately uses the existing attendance-context resolver rather
   * than implementing another shift-resolution algorithm inside reporting.
   */
  for (const user of users) {
    const userId = user.id;

    /*
     * Build one row for each calendar work date.
     */
    let currentDate = parseDateOnly(request.date_from);

    const finalDate = parseDateOnly(request.date_to);

    while (currentDate.getTime() <= finalDate.getTime()) {
      const requestedDate = currentDate.toISOString().slice(0, 10);

      /*
       * We need an instant to ask the existing attendance resolver for the
       * authoritative shift/work-date context.
       *
       * Noon UTC is only a lookup anchor. The resolver itself remains
       * responsible for timezone and shift interpretation.
       */
      const timestamp = new Date(`${requestedDate}T12:00:00.000Z`);

      const attendanceContext = await resolveAttendanceContext({
        supabaseAdmin,

        workspaceId: request.workspace_id,

        userId,

        timestamp,

        requestedShiftId: null,

        requestedWorkDate: requestedDate,
      });

      /*
       * No shift assignment for this date.
       *
       * Do not manufacture an attendance row.
       */
      if (!attendanceContext) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      const { workDate, shift, userShiftId, startsAt, endsAt } =
        attendanceContext;

      /*
       * A requested date may resolve to another work_date for an overnight
       * shift. Respect the authoritative resolver.
       */
      if (!isDateInRange(workDate, request.date_from, request.date_to)) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      /*
       * Optional timezone filter.
       */
      if (request.timezone && attendanceContext.timezone !== request.timezone) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      /*
       * Retrieve all events belonging to this exact work_date and
       * permanent user_shift.
       */
      const { data: logs, error: logsError } = await supabaseAdmin
        .from("time_logs")
        .select("*")
        .eq("workspace_id", request.workspace_id)
        .eq("user_id", userId)
        .eq("user_shift_id", userShiftId)
        .eq("work_date", workDate)
        .order("event_time_utc", {
          ascending: true,
        });

      if (logsError) {
        throw logsError;
      }

      const sessions =
        logs && logs.length > 0 ? buildAttendanceSessions(logs) : [];

      /*
       * For a daily report, combine all sessions belonging to the same
       * authoritative work date.
       */
      let firstTimeIn: string | null = null;

      let lastTimeOut: string | null = null;

      let breakMinutes = 0;

      let lunchMinutesTotal = 0;

      let workedMinutes = 0;

      for (const session of sessions) {
        if (
          session.time_in &&
          (!firstTimeIn ||
            new Date(session.time_in).getTime() <
              new Date(firstTimeIn).getTime())
        ) {
          firstTimeIn = session.time_in;
        }

        if (
          session.time_out &&
          (!lastTimeOut ||
            new Date(session.time_out).getTime() >
              new Date(lastTimeOut).getTime())
        ) {
          lastTimeOut = session.time_out;
        }

        breakMinutes += sumBreakMinutes(session);

        lunchMinutesTotal += lunchMinutes(session);

        workedMinutes += getWorkedMinutes(session);
      }

      const scheduledMinutes = getShiftDurationMinutes(startsAt, endsAt);

      const lateMinutes = calculateLateMinutes(firstTimeIn, startsAt);

      const overtimeMinutes = calculateOvertimeMinutes(lastTimeOut, endsAt);

      const undertimeMinutes = lastTimeOut
        ? calculateUndertimeMinutes(workedMinutes, scheduledMinutes)
        : 0;

      /*
       * Map employee metadata.
       *
       * The exact database-generated field names are used defensively here
       * because existing installations may have nullable department/position
       * relationships.
       */
      const employeeNo = String(
        (user as Record<string, unknown>).employee_no ?? "",
      );

      const employeeName = String(
        (user as Record<string, unknown>).display_name ??
          (user as Record<string, unknown>).full_name ??
          (user as Record<string, unknown>).name ??
          email,
      );

      let department: string | null = null;

      let position: string | null = null;

      const departmentId = (user as Record<string, unknown>).department_id;

      const positionId = (user as Record<string, unknown>).position_id;

      if (departmentId) {
        const { data: departmentRecord } = await supabaseAdmin
          .from("departments")
          .select("*")
          .eq("id", String(departmentId))
          .maybeSingle();

        if (departmentRecord) {
          const record = departmentRecord as Record<string, unknown>;

          department =
            String(record.name ?? record.department_name ?? "") || null;
        }
      }

      if (positionId) {
        const { data: positionRecord } = await supabaseAdmin
          .from("positions")
          .select("*")
          .eq("id", String(positionId))
          .maybeSingle();

        if (positionRecord) {
          const record = positionRecord as Record<string, unknown>;

          position = String(record.name ?? record.position_name ?? "") || null;
        }
      }

      const attendanceStatus = getAttendanceStatus({
        timeIn: firstTimeIn,

        timeOut: lastTimeOut,

        workedMinutes,

        lateMinutes,

        undertimeMinutes,

        overtimeMinutes,
      });

      rows.push({
        user_id: userId,

        employee_no: employeeNo,

        employee_name: employeeName,

        department,

        position,

        shift_name: shift?.name ?? null,

        work_date: workDate,

        time_in: firstTimeIn,

        time_out: lastTimeOut,

        break_minutes: breakMinutes,

        lunch_minutes: lunchMinutesTotal,

        total_break_minutes: breakMinutes + lunchMinutesTotal,

        worked_minutes: workedMinutes,

        late_minutes: lateMinutes,

        undertime_minutes: undertimeMinutes,

        overtime_minutes: overtimeMinutes,

        attendance_status: attendanceStatus,

        timezone: attendanceContext.timezone,
      });

      currentDate = addDays(currentDate, 1);
    }
  }

  rows.sort((a, b) => {
    if (a.work_date !== b.work_date) {
      return a.work_date.localeCompare(b.work_date);
    }

    return a.employee_name.localeCompare(b.employee_name);
  });

  return rows;
}
