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

/**
 * Monday of the week containing the supplied date.
 */
function getWeekStart(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00Z`);

  const day = date.getUTCDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  date.setUTCDate(date.getUTCDate() + mondayOffset);

  return date.toISOString().slice(0, 10);
}

function getWeekEnd(weekStart: string): string {
  return addDays(weekStart, 6);
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
/* Attendance Metrics                                                         */
/* -------------------------------------------------------------------------- */

function calculateMetrics(
  session: AttendanceSession | null,
  shift: ShiftRow | null,
): {
  worked_minutes: number;
  break_minutes: number;
  scheduled_minutes: number;
  late_minutes: number;
  undertime_minutes: number;
  overtime_minutes: number;
  attendance_status: string;
} {
  if (!session || !session.time_in) {
    return {
      worked_minutes: 0,

      break_minutes: 0,

      scheduled_minutes: shift
        ? Math.max(
            0,
            getShiftWindow(
              extractWorkDate(session?.time_in ?? "", shift.timezone),
              shift,
            ).endsAt.getTime(),
          )
        : 0,

      late_minutes: 0,

      undertime_minutes: 0,

      overtime_minutes: 0,

      attendance_status: "ABSENT",
    };
  }

  const elapsedMinutes = getMinutesBetween(session.time_in, session.time_out);

  const breakMinutes = getBreakMinutes(session);

  const workedMinutes = Math.max(0, elapsedMinutes - breakMinutes);

  if (!shift) {
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

  const workDate = extractWorkDate(session.time_in, shift.timezone);

  const shiftWindow = getShiftWindow(workDate, shift);

  const scheduledMinutes = Math.max(
    0,
    Math.floor(
      (shiftWindow.endsAt.getTime() - shiftWindow.startsAt.getTime()) / 60000,
    ) - shift.break_minutes,
  );

  const timeIn = new Date(session.time_in);

  const graceMinutes = Math.max(0, shift.grace_minutes ?? 0);

  const lateThreshold = shiftWindow.startsAt.getTime() + graceMinutes * 60000;

  const lateMinutes =
    timeIn.getTime() > lateThreshold
      ? Math.floor((timeIn.getTime() - shiftWindow.startsAt.getTime()) / 60000)
      : 0;

  let undertimeMinutes = 0;

  let overtimeMinutes = 0;

  if (session.time_out) {
    const timeOut = new Date(session.time_out);

    if (timeOut.getTime() < shiftWindow.endsAt.getTime()) {
      undertimeMinutes = Math.floor(
        (shiftWindow.endsAt.getTime() - timeOut.getTime()) / 60000,
      );
    }

    if (timeOut.getTime() > shiftWindow.endsAt.getTime()) {
      overtimeMinutes = Math.floor(
        (timeOut.getTime() - shiftWindow.endsAt.getTime()) / 60000,
      );
    }
  }

  let attendanceStatus = "PRESENT";

  if (!session.time_out) {
    attendanceStatus = "INCOMPLETE";
  } else if (lateMinutes > 0) {
    attendanceStatus = "LATE";
  } else if (undertimeMinutes > 0) {
    attendanceStatus = "UNDERTIME";
  } else if (overtimeMinutes > 0) {
    attendanceStatus = "OVERTIME";
  }

  return {
    worked_minutes: workedMinutes,

    break_minutes: breakMinutes,

    scheduled_minutes: scheduledMinutes,

    late_minutes: lateMinutes,

    undertime_minutes: undertimeMinutes,

    overtime_minutes: overtimeMinutes,

    attendance_status: attendanceStatus,
  };
}

/* -------------------------------------------------------------------------- */
/* Work Date                                                                  */
/* -------------------------------------------------------------------------- */

function extractWorkDate(timestamp: string, timezone: string): string {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp.slice(0, 10);
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return [values.year, values.month, values.day].join("-");
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

  if (!workspace_id) {
    throw new Error("Workspace ID is required.");
  }

  validateDateRange(date_from, date_to);

  const dates = getDateRange(date_from, date_to);

  /* ------------------------------------------------------------------------ */
  /* Users                                                                     */
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
  /* Daily Report                                                              */
  /* ------------------------------------------------------------------------ */

  const rows: AttendanceReportRow[] = [];

  const breakRows: BreakReportRow[] = [];

  for (const user of users) {
    const assignments = (userShifts ?? []).filter(
      (assignment) => assignment.user_id === user.id,
    );

    for (const workDate of dates) {
      const assignment = findUserShiftForDate(assignments, workDate);

      const logsForDate = logsByUserAndDate.get(`${user.id}:${workDate}`) ?? [];

      if (!assignment && logsForDate.length === 0) {
        continue;
      }

      const shift = assignment
        ? (shiftsById.get(assignment.shift_id) ?? null)
        : logsForDate.length > 0
          ? (shiftsById.get(logsForDate[0].user_shift_id) ?? null)
          : null;

      const sessions =
        logsForDate.length > 0 ? buildAttendanceSessions(logsForDate) : [];

      const latestSession = getLatestAttendanceSession(sessions);

      const metrics = calculateMetrics(latestSession, shift);

      const department = user.department_id
        ? (departmentsById.get(user.department_id) ?? null)
        : null;

      const position = user.position_id
        ? (positionsById.get(user.position_id) ?? null)
        : null;

      const rowTimezone =
        timezone ?? shift?.timezone ?? logsForDate[0]?.timezone ?? "UTC";

      /* -------------------------------------------------------------------- */
      /* Daily row                                                             */
      /* -------------------------------------------------------------------- */

      rows.push({
        user_id: user.id,

        employee_no: user.employee_no,

        employee_name: user.display_name,

        department: department?.name ?? null,

        position: position?.title ?? null,

        shift_name: shift?.name ?? null,

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
      /* Break rows                                                            */
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
  /* Weekly Aggregation                                                       */
  /* ------------------------------------------------------------------------ */

  const weeklyMap = new Map<string, WeeklyReportRow>();

  for (const row of rows) {
    const weekStart = getWeekStart(row.work_date);

    const weekEnd = getWeekEnd(weekStart);

    const key = `${row.user_id}:${weekStart}`;

    const existing = weeklyMap.get(key);

    if (!existing) {
      weeklyMap.set(key, {
        user_id: row.user_id,

        employee_no: row.employee_no,

        employee_name: row.employee_name,

        department: row.department,

        week_start: weekStart,

        week_end: weekEnd,

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

  const weeklyRows = Array.from(weeklyMap.values());

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
    const dateCompare = a.week_start.localeCompare(b.week_start);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return a.employee_name.localeCompare(b.employee_name);
  });

  return {
    rows,

    break_rows: breakRows,

    weekly_rows: weeklyRows,
  };
}
