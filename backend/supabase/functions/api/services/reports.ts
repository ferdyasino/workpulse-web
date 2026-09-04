import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@shared/types/database.ts";

import type {
  AttendanceReportRequest,
  AttendanceReportRow,
  BreakReportRow,
  WeeklyReportRow,
} from "@shared/types/api/api.report.ts";

import {
  buildAttendanceSessions,
  getLatestAttendanceSession,
} from "./attendance/sessions.ts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type UserRow = Tables<"users">;
type ShiftRow = Tables<"shifts">;
type UserShiftRow = Tables<"user_shifts">;
type TimeLogRow = Tables<"time_logs">;
type DepartmentRow = Tables<"departments">;
type PositionRow = Tables<"positions">;

type AttendanceSession = ReturnType<typeof buildAttendanceSessions>[number];

type AttendanceReportRowWithShiftTimes = AttendanceReportRow & {
  shift_start_time: string | null;
  shift_end_time: string | null;
};

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

function validateDate(value: string, field: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} must use YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ${field}.`);
  }

  if (date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Invalid ${field}.`);
  }
}

function validateDateRange(dateFrom: string, dateTo: string): void {
  validateDate(dateFrom, "date_from");
  validateDate(dateTo, "date_to");

  if (dateFrom > dateTo) {
    throw new Error("date_from cannot be later than date_to.");
  }
}

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                               */
/* -------------------------------------------------------------------------- */

function addDays(dateString: string, amount: number): string {
  const date = new Date(`${dateString}T00:00:00Z`);

  date.setUTCDate(date.getUTCDate() + amount);

  return date.toISOString().slice(0, 10);
}

function getDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];

  let current = dateFrom;

  while (current <= dateTo) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

/* -------------------------------------------------------------------------- */
/* Time Helpers                                                               */
/* -------------------------------------------------------------------------- */

function getMinutesBetween(start: string | null, end: string | null): number {
  if (!start || !end) {
    return 0;
  }

  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
    return 0;
  }

  if (endTime <= startTime) {
    return 0;
  }

  return Math.floor((endTime - startTime) / 60000);
}

function getMinutesBetweenDates(start: Date, end: Date): number {
  const difference = end.getTime() - start.getTime();

  if (difference <= 0) {
    return 0;
  }

  return Math.floor(difference / 60000);
}

/* -------------------------------------------------------------------------- */
/* Break Helpers                                                              */
/* -------------------------------------------------------------------------- */

function getBreakPeriods(session: AttendanceSession): {
  type: "BREAK" | "LUNCH";
  break_in: string | null;
  break_out: string | null;
  break_minutes: number;
}[] {
  const periods: {
    type: "BREAK" | "LUNCH";
    break_in: string | null;
    break_out: string | null;
    break_minutes: number;
  }[] = [];

  let breakNumber = 0;

  for (const breakPeriod of session.breaks) {
    breakNumber += 1;

    periods.push({
      type: "BREAK",
      break_in: breakPeriod.in,
      break_out: breakPeriod.out,
      break_minutes: getMinutesBetween(breakPeriod.in, breakPeriod.out),
    });
  }

  if (session.lunch.in || session.lunch.out) {
    periods.push({
      type: "LUNCH",
      break_in: session.lunch.in,
      break_out: session.lunch.out,
      break_minutes: getMinutesBetween(session.lunch.in, session.lunch.out),
    });
  }

  return periods;
}

function getBreakMinutes(session: AttendanceSession): number {
  return getBreakPeriods(session).reduce(
    (total, period) => total + period.break_minutes,
    0,
  );
}

/* -------------------------------------------------------------------------- */
/* Shift Time Helpers                                                         */
/* -------------------------------------------------------------------------- */

function localDateTimeToUtc(
  date: string,
  time: string,
  timezone: string,
): Date {
  const [hours, minutes, seconds = "0"] = time.split(":");

  const hour = Number(hours);
  const minute = Number(minutes);
  const second = Number(seconds);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    throw new Error(`Invalid shift time: ${time}`);
  }

  const wallClockUtc = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    hour,
    minute,
    second,
  );

  let candidate = new Date(wallClockUtc);

  for (let attempt = 0; attempt < 3; attempt++) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    const observedUtc = Date.UTC(
      Number(values.year),
      Number(values.month) - 1,
      Number(values.day),
      Number(values.hour),
      Number(values.minute),
      Number(values.second),
    );

    const difference = wallClockUtc - observedUtc;

    if (difference === 0) {
      break;
    }

    candidate = new Date(candidate.getTime() + difference);
  }

  return candidate;
}

function getShiftWindow(
  workDate: string,
  shift: ShiftRow,
): {
  startsAt: Date;
  endsAt: Date;
} {
  const startsAt = localDateTimeToUtc(
    workDate,
    shift.start_time,
    shift.timezone,
  );

  const endDate = shift.is_overnight ? addDays(workDate, 1) : workDate;

  const endsAt = localDateTimeToUtc(endDate, shift.end_time, shift.timezone);

  return {
    startsAt,
    endsAt,
  };
}

/* -------------------------------------------------------------------------- */
/* Scheduled Minutes                                                          */
/* -------------------------------------------------------------------------- */

function getScheduledMinutes(
  // shift: ShiftRow,
  shiftWindow: {
    startsAt: Date;
    endsAt: Date;
  },
): number {
  const shiftSpanMinutes = getMinutesBetweenDates(
    shiftWindow.startsAt,
    shiftWindow.endsAt,
  );

  return shiftSpanMinutes;
}

/* -------------------------------------------------------------------------- */
/* Attendance Metrics                                                         */
/* -------------------------------------------------------------------------- */

function calculateMetrics(
  session: AttendanceSession | null,
  shift: ShiftRow | null,
  workDate: string,
): {
  worked_minutes: number;
  break_minutes: number;
  scheduled_minutes: number;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  attendance_status: string;
} {
  /*
   * No shift means there is no scheduled target.
   */
  if (!shift) {
    if (!session || !session.time_in) {
      return {
        worked_minutes: 0,
        break_minutes: 0,
        scheduled_minutes: 0,
        late_minutes: 0,
        undertime_minutes: 0,
        overtime_minutes: 0,
        attendance_status: "ABSENT",
      };
    }

    const breakMinutes = getBreakMinutes(session);

    const workedMinutes = Math.max(
      0,
      getMinutesBetween(session.time_in, session.time_out) - breakMinutes,
    );

    return {
      worked_minutes: workedMinutes,
      break_minutes: breakMinutes,
      scheduled_minutes: 0,
      late_minutes: 0,
      undertime_minutes: 0,
      overtime_minutes: 0,
      attendance_status: session.time_out ? "PRESENT" : "INCOMPLETE",
    };
  }

  const shiftWindow = getShiftWindow(workDate, shift);

  const scheduledMinutes = getScheduledMinutes(shiftWindow);

  /*
   * No IN = absent.
   *
   * Range reports will never reach this state because
   * no-activity dates are excluded before the row is built.
   */
  if (!session || !session.time_in) {
    return {
      worked_minutes: 0,
      break_minutes: 0,
      scheduled_minutes: scheduledMinutes,
      late_minutes: 0,
      undertime_minutes: 0,
      overtime_minutes: 0,
      attendance_status: "ABSENT",
    };
  }

  const breakMinutes = getBreakMinutes(session);

  /*
   * Actual worked time:
   *
   * attendance elapsed - actual breaks/lunch.
   */
  const elapsedMinutes = getMinutesBetween(session.time_in, session.time_out);

  let workedMinutes = Math.max(0, elapsedMinutes - breakMinutes);

  const timeIn = new Date(session.time_in);

  if (Number.isNaN(timeIn.getTime())) {
    return {
      worked_minutes: workedMinutes,
      break_minutes: breakMinutes,
      scheduled_minutes: scheduledMinutes,
      late_minutes: 0,
      undertime_minutes: 0,
      overtime_minutes: 0,
      attendance_status: session.time_out ? "PRESENT" : "INCOMPLETE",
    };
  }

  const graceMinutes = Math.max(0, shift.grace_minutes ?? 0);

  const shiftStartMs = shiftWindow.startsAt.getTime();

  const shiftEndMs = shiftWindow.endsAt.getTime();

  const timeInMs = timeIn.getTime();

  /*
   * Actual late minutes.
   */
  const actualLateMinutes =
    timeInMs > shiftStartMs ? Math.floor((timeInMs - shiftStartMs) / 60000) : 0;

  const lateMinutes =
    actualLateMinutes > graceMinutes ? actualLateMinutes - graceMinutes : 0;

  /*
   * Grace credit.
   */
  if (actualLateMinutes > 0 && actualLateMinutes <= graceMinutes) {
    workedMinutes += actualLateMinutes;
  }

  let undertimeMinutes = 0;
  let overtimeMinutes = 0;

  /*
   * Undertime is missing attendance span.
   *
   * It is NOT:
   *
   * scheduled - worked
   */
  if (session.time_out) {
    const timeOut = new Date(session.time_out);

    if (!Number.isNaN(timeOut.getTime())) {
      const timeOutMs = timeOut.getTime();

      let effectiveAttendanceStartMs = timeInMs;

      /*
       * Give back grace if arrival
       * was inside the grace window.
       */
      if (actualLateMinutes > 0 && actualLateMinutes <= graceMinutes) {
        effectiveAttendanceStartMs = shiftStartMs;
      }

      /*
       * Undertime before shift end.
       */
      if (timeOutMs < shiftEndMs) {
        undertimeMinutes = Math.floor(
          (shiftEndMs - effectiveAttendanceStartMs) / 60000,
        );

        undertimeMinutes = Math.max(0, undertimeMinutes);
      }

      /*
       * Overtime after shift end.
       */
      if (timeOutMs > shiftEndMs) {
        overtimeMinutes = Math.floor((timeOutMs - shiftEndMs) / 60000);
      }
    }
  }

  /*
   * Status priority.
   */
  let attendanceStatus = "PRESENT";

  if (!session.time_out) {
    attendanceStatus = "INCOMPLETE";
  } else if (lateMinutes > 0 && overtimeMinutes > 0) {
    attendanceStatus = "LATE_OVERTIME";
  } else if (lateMinutes > 0 && undertimeMinutes > 0) {
    attendanceStatus = "LATE_UNDERTIME";
  } else if (overtimeMinutes > 0) {
    attendanceStatus = "OVERTIME";
  } else if (lateMinutes > 0) {
    attendanceStatus = "LATE";
  } else if (undertimeMinutes > 0) {
    attendanceStatus = "UNDERTIME";
  }

  return {
    worked_minutes: Math.max(0, Math.floor(workedMinutes)),
    break_minutes: breakMinutes,
    scheduled_minutes: scheduledMinutes,
    late_minutes: Math.max(0, lateMinutes),
    undertime_minutes: Math.max(0, undertimeMinutes),
    overtime_minutes: Math.max(0, overtimeMinutes),
    attendance_status: attendanceStatus,
  };
}

/* -------------------------------------------------------------------------- */
/* User Assignment                                                            */
/* -------------------------------------------------------------------------- */

function findUserShiftForDate(
  userShifts: UserShiftRow[],
  date: string,
): UserShiftRow | null {
  const candidates = userShifts.filter((assignment) => {
    if (assignment.deleted_at) {
      return false;
    }

    if (assignment.effective_from > date) {
      return false;
    }

    if (assignment.effective_to && assignment.effective_to < date) {
      return false;
    }

    return true;
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => b.effective_from.localeCompare(a.effective_from));

  return candidates[0];
}

/* -------------------------------------------------------------------------- */
/* Range Aggregation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Range Hours is an exact user-selected date range.
 *
 * Example:
 *
 * 2026-08-31 -> 2026-09-06
 *
 * produces ONE aggregate row per employee:
 *
 * week_start = 2026-08-31
 * week_end   = 2026-09-06
 *
 * It does NOT split by calendar week.
 *
 * Important:
 *
 * Only attendance rows with actual attendance activity
 * are included. Scheduled-but-unused shift dates do not
 * create ABSENT rows in a range report.
 */
function buildRangeRows(
  rows: AttendanceReportRowWithShiftTimes[],
  dateFrom: string,
  dateTo: string,
): WeeklyReportRow[] {
  const rangeMap = new Map<string, WeeklyReportRow>();

  for (const row of rows) {
    /*
     * Range reports only include actual attendance
     * activity.
     *
     * This additional guard makes the aggregation
     * defensive even if a future caller supplies an
     * ABSENT row.
     */
    const hasAttendanceActivity =
      Boolean(row.time_in) ||
      Boolean(row.time_out) ||
      row.worked_minutes > 0 ||
      row.break_minutes > 0 ||
      row.late_minutes > 0 ||
      row.undertime_minutes > 0 ||
      row.overtime_minutes > 0;

    if (!hasAttendanceActivity) {
      continue;
    }

    const key = row.user_id;

    const existing = rangeMap.get(key);

    if (!existing) {
      rangeMap.set(key, {
        user_id: row.user_id,

        employee_no: row.employee_no,

        employee_name: row.employee_name,

        department: row.department,

        /*
         * Keep the existing API field names for
         * frontend compatibility.
         *
         * Semantically these now represent the
         * selected report range.
         */
        week_start: dateFrom,

        week_end: dateTo,

        days_present: row.time_in ? 1 : 0,

        days_absent: row.attendance_status === "ABSENT" ? 1 : 0,

        total_scheduled_minutes: row.scheduled_minutes,

        total_worked_minutes: row.worked_minutes,

        total_break_minutes: row.break_minutes,

        total_late_minutes: row.late_minutes,

        total_undertime_minutes: row.undertime_minutes,

        total_overtime_minutes: row.overtime_minutes,

        timezone: row.timezone,
      });

      continue;
    }

    if (row.time_in) {
      existing.days_present += 1;
    }

    if (row.attendance_status === "ABSENT") {
      existing.days_absent += 1;
    }

    existing.total_scheduled_minutes += row.scheduled_minutes;

    existing.total_worked_minutes += row.worked_minutes;

    existing.total_break_minutes += row.break_minutes;

    existing.total_late_minutes += row.late_minutes;

    existing.total_undertime_minutes += row.undertime_minutes;

    existing.total_overtime_minutes += row.overtime_minutes;
  }

  return Array.from(rangeMap.values());
}

/* -------------------------------------------------------------------------- */
/* Report Result                                                              */
/* -------------------------------------------------------------------------- */

export async function getAttendanceReport(
  supabaseAdmin: SupabaseClient<Database>,
  request: Omit<AttendanceReportRequest, "action">,
): Promise<{
  rows: AttendanceReportRow[];
  break_rows: BreakReportRow[];
  weekly_rows: WeeklyReportRow[];
}> {
  const { workspace_id, date_from, date_to, user_id, department_id, timezone } =
    request;

  const reportType = String(request.report_type ?? "DAILY").toUpperCase();

  const isRangeReport = reportType === "WEEKLY" || reportType === "RANGE";

  if (!workspace_id) {
    throw new Error("Workspace ID is required.");
  }

  validateDateRange(date_from, date_to);

  const dates = getDateRange(date_from, date_to);

  /* ------------------------------------------------------------------------ */
  /* Users                                                                    */
  /* ------------------------------------------------------------------------ */

  let usersQuery = supabaseAdmin
    .from("users")
    .select("*")
    .eq("workspace_id", workspace_id)
    .is("deleted_at", null);

  if (user_id) {
    usersQuery = usersQuery.eq("id", user_id);
  }

  if (department_id) {
    usersQuery = usersQuery.eq("department_id", department_id);
  }

  const { data: users, error: usersError } = await usersQuery;

  if (usersError) {
    throw usersError;
  }

  if (!users || users.length === 0) {
    return {
      rows: [],
      break_rows: [],
      weekly_rows: [],
    };
  }

  /* ------------------------------------------------------------------------ */
  /* Departments                                                              */
  /* ------------------------------------------------------------------------ */

  const departmentIds = Array.from(
    new Set(
      users
        .map((user) => user.department_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const departmentsById = new Map<string, DepartmentRow>();

  if (departmentIds.length > 0) {
    const { data: departments, error } = await supabaseAdmin
      .from("departments")
      .select("*")
      .in("id", departmentIds);

    if (error) {
      throw error;
    }

    for (const department of departments ?? []) {
      departmentsById.set(department.id, department);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Positions                                                                */
  /* ------------------------------------------------------------------------ */

  const positionIds = Array.from(
    new Set(
      users
        .map((user) => user.position_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const positionsById = new Map<string, PositionRow>();

  if (positionIds.length > 0) {
    const { data: positions, error } = await supabaseAdmin
      .from("positions")
      .select("*")
      .in("id", positionIds);

    if (error) {
      throw error;
    }

    for (const position of positions ?? []) {
      positionsById.set(position.id, position);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* User Shifts                                                              */
  /* ------------------------------------------------------------------------ */

  const userIds = users.map((user) => user.id);

  const { data: userShifts, error: userShiftsError } = await supabaseAdmin
    .from("user_shifts")
    .select("*")
    .eq("workspace_id", workspace_id)
    .in("user_id", userIds)
    .is("deleted_at", null);

  if (userShiftsError) {
    throw userShiftsError;
  }

  /* ------------------------------------------------------------------------ */
  /* Shifts                                                                    */
  /* ------------------------------------------------------------------------ */

  const shiftIds = Array.from(
    new Set((userShifts ?? []).map((assignment) => assignment.shift_id)),
  );

  const shiftsById = new Map<string, ShiftRow>();

  if (shiftIds.length > 0) {
    const { data: shifts, error } = await supabaseAdmin
      .from("shifts")
      .select("*")
      .in("id", shiftIds);

    if (error) {
      throw error;
    }

    for (const shift of shifts ?? []) {
      shiftsById.set(shift.id, shift);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Time Logs                                                                 */
  /* ------------------------------------------------------------------------ */

  let logsQuery = supabaseAdmin
    .from("time_logs")
    .select("*")
    .eq("workspace_id", workspace_id)
    .in("user_id", userIds)
    .gte("work_date", date_from)
    .lte("work_date", date_to)
    .order("event_time_utc", {
      ascending: true,
    });

  if (user_id) {
    logsQuery = logsQuery.eq("user_id", user_id);
  }

  const { data: logs, error: logsError } = await logsQuery;

  if (logsError) {
    throw logsError;
  }

  const logsByUserAndDate = new Map<string, TimeLogRow[]>();

  for (const log of logs ?? []) {
    const key = `${log.user_id}:${log.work_date}`;

    const existing = logsByUserAndDate.get(key) ?? [];

    existing.push(log);

    logsByUserAndDate.set(key, existing);
  }

  /* ------------------------------------------------------------------------ */
  /* Report Rows                                                               */
  /* ------------------------------------------------------------------------ */

  const rows: AttendanceReportRowWithShiftTimes[] = [];

  const breakRows: BreakReportRow[] = [];

  for (const user of users) {
    const assignments = (userShifts ?? []).filter(
      (assignment) => assignment.user_id === user.id,
    );

    for (const workDate of dates) {
      const assignment = findUserShiftForDate(assignments, workDate);

      const logsForDate = logsByUserAndDate.get(`${user.id}:${workDate}`) ?? [];

      /*
       * RANGE/WEEKLY REPORT
       *
       * Critical behavior:
       *
       * If the employee has no time logs for
       * this date, DO NOT create an ABSENT row.
       *
       * This prevents:
       *
       * Aug 31 -> Sep 6
       * 7 dates × 480 minutes
       *
       * from becoming:
       *
       * 7 absent days / 3360 scheduled minutes.
       */
      if (isRangeReport && logsForDate.length === 0) {
        continue;
      }

      /*
       * DAILY/BREAK behavior:
       *
       * Keep scheduled employees visible even
       * when they have no attendance.
       *
       * This preserves daily ABSENT reporting.
       */
      if (!assignment && logsForDate.length === 0) {
        continue;
      }

      /*
       * Resolve shift from assignment first.
       *
       * If attendance exists without an assignment,
       * use the user_shift_id stored on the log.
       */
      const shift = assignment
        ? (shiftsById.get(assignment.shift_id) ?? null)
        : logsForDate.length > 0
          ? (shiftsById.get(logsForDate[0].user_shift_id) ?? null)
          : null;

      const sessions =
        logsForDate.length > 0 ? buildAttendanceSessions(logsForDate) : [];

      /*
       * Only sessions containing actual IN/OUT
       * attendance activity count for range reports.
       *
       * Break-only/lunch-only records do not make
       * an employee appear in Range Hours.
       */
      const hasAttendanceActivity = sessions.some(
        (session) => Boolean(session.time_in) || Boolean(session.time_out),
      );

      if (isRangeReport && !hasAttendanceActivity) {
        continue;
      }

      const latestSession = getLatestAttendanceSession(sessions);

      const metrics = calculateMetrics(latestSession, shift, workDate);

      const department = user.department_id
        ? (departmentsById.get(user.department_id) ?? null)
        : null;

      const position = user.position_id
        ? (positionsById.get(user.position_id) ?? null)
        : null;

      const rowTimezone =
        timezone ?? shift?.timezone ?? logsForDate[0]?.timezone ?? "UTC";

      /* -------------------------------------------------------------------- */
      /* Daily Row                                                             */
      /* -------------------------------------------------------------------- */

      rows.push({
        user_id: user.id,

        employee_no: user.employee_no,

        employee_name: user.display_name,

        department: department?.name ?? null,

        position: position?.title ?? null,

        shift_name: shift?.name ?? null,

        shift_start_time: shift?.start_time ?? null,

        shift_end_time: shift?.end_time ?? null,

        work_date: workDate,

        time_in: latestSession?.time_in ?? null,

        time_out: latestSession?.time_out ?? null,

        break_minutes: metrics.break_minutes,

        worked_minutes: metrics.worked_minutes,

        scheduled_minutes: metrics.scheduled_minutes,

        late_minutes: metrics.late_minutes,

        undertime_minutes: metrics.undertime_minutes,

        overtime_minutes: metrics.overtime_minutes,

        attendance_status: metrics.attendance_status,

        timezone: rowTimezone,
      });

      /* -------------------------------------------------------------------- */
      /* Break Rows                                                            */
      /* -------------------------------------------------------------------- */

      if (latestSession) {
        const periods = getBreakPeriods(latestSession);

        let breakNumber = 0;

        for (const period of periods) {
          if (period.type === "BREAK") {
            breakNumber += 1;
          }

          breakRows.push({
            user_id: user.id,

            employee_no: user.employee_no,

            employee_name: user.display_name,

            department: department?.name ?? null,

            work_date: workDate,

            break_number: period.type === "LUNCH" ? 0 : breakNumber,

            break_type: period.type,

            break_in: period.break_in,

            break_out: period.break_out,

            break_minutes: period.break_minutes,

            timezone: rowTimezone,
          });
        }
      }
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Range Hours                                                               */
  /* ------------------------------------------------------------------------ */

  /*
   * For RANGE/WEEKLY:
   *
   * Aggregate ONLY the selected date range.
   *
   * Do not calculate calendar-week boundaries.
   */
  const weeklyRows = isRangeReport
    ? buildRangeRows(rows, date_from, date_to)
    : [];

  /* ------------------------------------------------------------------------ */
  /* Sort                                                                      */
  /* ------------------------------------------------------------------------ */

  rows.sort((a, b) => {
    const dateCompare = a.work_date.localeCompare(b.work_date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.employee_name.localeCompare(b.employee_name);
  });

  breakRows.sort((a, b) => {
    const dateCompare = a.work_date.localeCompare(b.work_date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const nameCompare = a.employee_name.localeCompare(b.employee_name);

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.break_number - b.break_number;
  });

  weeklyRows.sort((a, b) => {
    const nameCompare = a.employee_name.localeCompare(b.employee_name);

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.week_start.localeCompare(b.week_start);
  });

  return {
    rows,

    break_rows: breakRows,

    weekly_rows: weeklyRows,
  };
}
