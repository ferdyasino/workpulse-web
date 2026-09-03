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

  scheduled_minutes: number;

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

function minutesBetweenDates(start: Date, end: Date): number {
  const startMs = start.getTime();
  const endMs = end.getTime();

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

/* -------------------------------------------------------------------------- */
/* Shift Configuration                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The shift record may evolve as the settings/schema evolves.
 *
 * We intentionally read the configuration dynamically here so this report
 * does not depend on a second shift-resolution implementation.
 */
type ShiftConfigRecord = Record<string, unknown>;

function getShiftConfig(shift: unknown): ShiftConfigRecord {
  if (shift && typeof shift === "object") {
    return shift as ShiftConfigRecord;
  }

  return {};
}

function getNumericShiftValue(
  shift: unknown,
  keys: string[],
  fallback = 0,
): number {
  const record = getShiftConfig(shift);

  for (const key of keys) {
    const value = record[key];

    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.max(0, Math.floor(value));
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.floor(parsed));
      }
    }
  }

  return fallback;
}

/**
 * Returns the configured grace period for the resolved shift.
 *
 * Primary expected field:
 *   grace_minutes
 *
 * The fallback names allow the report to remain compatible if the shift
 * schema uses one of the equivalent names.
 */
function getShiftGraceMinutes(shift: unknown): number {
  return getNumericShiftValue(
    shift,
    ["grace_minutes", "late_grace_minutes", "grace_period_minutes"],
    0,
  );
}

/**
 * Returns the configured break allowance for the resolved shift.
 *
 * Primary expected field:
 *   break_minutes
 *
 * This represents the shift's allowed/scheduled break allowance.
 *
 * It is NOT the same thing as actual recorded break time.
 */
function getShiftBreakAllowanceMinutes(shift: unknown): number {
  return getNumericShiftValue(
    shift,
    ["break_minutes", "break_allowance_minutes", "break_minutes_per_day"],
    0,
  );
}

/* -------------------------------------------------------------------------- */
/* Worked Time                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Worked minutes represent actual net working time:
 *
 *     attendance elapsed
 *       - regular breaks
 *       - lunch
 *
 * Grace handling is applied later after the employee's first IN is known.
 *
 * This is intentional because the report aggregates sessions first.
 */
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

/**
 * Apply grace credit to Worked.
 *
 * Example:
 *
 * Shift:       08:00 - 17:00
 * Grace:       10 minutes
 * IN:          08:10
 * OUT:         17:00
 * Break/lunch: 60 minutes
 *
 * Raw worked:
 *   08:10 -> 17:00 = 8h50
 *   8h50 - 1h = 7h50
 *
 * Because the employee is entirely within the grace period,
 * the 10-minute grace is credited back:
 *
 *   7h50 + 10m = 8h00
 *
 * Therefore grace does not reduce work hours.
 */
function applyGraceToWorkedMinutes(
  workedMinutes: number,
  timeIn: string | null,
  startsAt: Date,
  graceMinutes: number,
): number {
  if (!timeIn || graceMinutes <= 0) {
    return workedMinutes;
  }

  const actualIn = new Date(timeIn);

  if (Number.isNaN(actualIn.getTime())) {
    return workedMinutes;
  }

  const lateFromStart = Math.max(
    0,
    Math.floor((actualIn.getTime() - startsAt.getTime()) / 60_000),
  );

  if (lateFromStart <= 0 || lateFromStart > graceMinutes) {
    return workedMinutes;
  }

  return workedMinutes + lateFromStart;
}

/* -------------------------------------------------------------------------- */
/* Date Helpers                                                               */
/* -------------------------------------------------------------------------- */

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

/**
 * Returns the actual resolved shift span.
 *
 * This uses the Date instants returned by resolveAttendanceContext().
 *
 * Therefore overnight shifts are handled correctly.
 *
 * Examples:
 *
 *   08:00 -> 16:00 = 480 minutes
 *   08:00 -> 17:00 = 540 minutes
 *   10:00 -> 20:00 = 600 minutes
 *   22:00 -> 06:00 = 480 minutes
 */
function getShiftSpanMinutes(startsAt: Date, endsAt: Date): number {
  return minutesBetweenDates(startsAt, endsAt);
}

/**
 * Calculates scheduled work minutes.
 *
 * Business rule:
 *
 * 1. An exact 8-hour shift remains 8 hours.
 *    Break is tracked separately.
 *
 * 2. Longer shifts use their configured break allowance
 *    to derive scheduled work.
 *
 * Examples:
 *
 *   08:00 -> 16:00 = 08:00 scheduled
 *
 *   08:00 -> 17:00 + 60m break
 *   09:00 span - 01:00 break = 08:00 scheduled
 *
 *   08:00 -> 17:00 + 30m break
 *   09:00 span - 00:30 break = 08:30 scheduled
 *
 * 3. Partial shifts remain their actual shift span unless
 *    a configured break allowance exists and the business
 *    configuration explicitly requires it.
 */
function getScheduledMinutes(
  startsAt: Date,
  endsAt: Date,
  shift: unknown,
): number {
  const shiftSpanMinutes = getShiftSpanMinutes(startsAt, endsAt);

  if (shiftSpanMinutes <= 0) {
    return 0;
  }

  /**
   * Core business rule:
   *
   * A normal 8-hour shift is already the required 8 hours.
   * Do not reduce it because of the break configuration.
   */
  if (shiftSpanMinutes === 480) {
    return 480;
  }

  const breakAllowanceMinutes = getShiftBreakAllowanceMinutes(shift);

  /**
   * For shifts longer than 8 hours, the configured break
   * allowance represents the non-working portion of the
   * shift span.
   */
  if (shiftSpanMinutes > 480 && breakAllowanceMinutes > 0) {
    return Math.max(0, shiftSpanMinutes - breakAllowanceMinutes);
  }

  /**
   * Partial shifts such as:
   *
   *   08:00 -> 12:00 = 04:00
   *   18:00 -> 22:00 = 04:00
   *
   * remain their actual span unless configured otherwise.
   */
  return shiftSpanMinutes;
}

/* -------------------------------------------------------------------------- */
/* Late                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Calculates late minutes after the configured grace period.
 *
 * Example:
 *
 * Shift start: 08:00
 * Grace:       10m
 *
 * IN 08:00 -> 0 late
 * IN 08:05 -> 0 late
 * IN 08:10 -> 0 late
 * IN 08:11 -> 1 late
 * IN 08:20 -> 10 late
 *
 * The grace period is therefore not counted as late.
 */
function calculateLateMinutes(
  timeIn: string | null,
  startsAt: Date,
  graceMinutes: number,
): number {
  if (!timeIn) {
    return 0;
  }

  const actual = new Date(timeIn);

  if (Number.isNaN(actual.getTime())) {
    return 0;
  }

  const actualLateMinutes = Math.max(
    0,
    Math.floor((actual.getTime() - startsAt.getTime()) / 60_000),
  );

  if (actualLateMinutes <= graceMinutes) {
    return 0;
  }

  return actualLateMinutes - graceMinutes;
}

/* -------------------------------------------------------------------------- */
/* Overtime                                                                   */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Undertime                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Calculates undertime from missing attendance span.
 *
 * IMPORTANT:
 *
 * Do NOT use:
 *
 *   scheduledMinutes - workedMinutes
 *
 * because workedMinutes already removes breaks/lunch.
 *
 * Undertime compares the actual attendance coverage against
 * the actual scheduled shift span.
 *
 * Example:
 *
 *   Shift:       08:00 -> 17:00
 *   Attendance:  08:00 -> 17:00
 *   Break:       30m
 *
 *   Attendance span = 9h
 *   Required span   = 9h
 *   Undertime       = 0
 *
 * Another example:
 *
 *   Shift:       08:00 -> 17:00
 *   Grace:       10m
 *   Attendance:  08:10 -> 17:00
 *
 *   Raw attendance span = 8h50
 *
 *   Since the employee is within grace, 10m is credited:
 *
 *   Effective span = 9h
 *   Undertime      = 0
 *
 * If the employee clocks in at 08:11:
 *
 *   Raw span = 8h49
 *   Grace does not apply
 *   Undertime = 11m
 */
function calculateUndertimeMinutes(
  timeIn: string | null,
  timeOut: string | null,
  startsAt: Date,
  endsAt: Date,
  graceMinutes: number,
): number {
  if (!timeIn || !timeOut) {
    return 0;
  }

  const actualIn = new Date(timeIn);

  const actualOut = new Date(timeOut);

  if (Number.isNaN(actualIn.getTime()) || Number.isNaN(actualOut.getTime())) {
    return 0;
  }

  const scheduledSpanMinutes = getShiftSpanMinutes(startsAt, endsAt);

  let actualAttendanceMinutes = Math.max(
    0,
    Math.floor((actualOut.getTime() - actualIn.getTime()) / 60_000),
  );

  /**
   * If arrival was within grace, credit the grace
   * portion back to attendance coverage.
   */
  const actualLateFromStart = Math.max(
    0,
    Math.floor((actualIn.getTime() - startsAt.getTime()) / 60_000),
  );

  if (actualLateFromStart > 0 && actualLateFromStart <= graceMinutes) {
    actualAttendanceMinutes += actualLateFromStart;
  }

  return Math.max(0, scheduledSpanMinutes - actualAttendanceMinutes);
}

/* -------------------------------------------------------------------------- */
/* Attendance Status                                                          */
/* -------------------------------------------------------------------------- */

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

  /* ------------------------------------------------------------------------ */
  /* Workspace Authorization                                                  */
  /* ------------------------------------------------------------------------ */

  const authContext = await getUserContext(
    supabaseAdmin,
    authUserId,
    email,
    authProvider,
  );

  if (authContext.workspace_id !== request.workspace_id) {
    throw new Error("User does not belong to this workspace.");
  }

  /* ------------------------------------------------------------------------ */
  /* Employees                                                                */
  /* ------------------------------------------------------------------------ */

  const users = await getUsers(supabaseAdmin, request);

  const rows: AttendanceReportRow[] = [];

  /* ------------------------------------------------------------------------ */
  /* Employee / Date Processing                                               */
  /* ------------------------------------------------------------------------ */

  for (const user of users) {
    const userId = user.id;

    let currentDate = parseDateOnly(request.date_from);

    const finalDate = parseDateOnly(request.date_to);

    while (currentDate.getTime() <= finalDate.getTime()) {
      const requestedDate = currentDate.toISOString().slice(0, 10);

      /**
       * Noon UTC is only a lookup anchor.
       *
       * The attendance context resolver remains authoritative
       * for timezone, shift, override and work-date resolution.
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

      /**
       * No shift assignment means no attendance row.
       */
      if (!attendanceContext) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      const { workDate, shift, userShiftId, startsAt, endsAt } =
        attendanceContext;

      /**
       * Respect the authoritative work_date returned by the resolver.
       *
       * This is especially important for overnight shifts.
       */
      if (!isDateInRange(workDate, request.date_from, request.date_to)) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      /**
       * Optional timezone filter.
       */
      if (request.timezone && attendanceContext.timezone !== request.timezone) {
        currentDate = addDays(currentDate, 1);

        continue;
      }

      /* -------------------------------------------------------------------- */
      /* Shift Configuration                                                  */
      /* -------------------------------------------------------------------- */

      const graceMinutes = getShiftGraceMinutes(shift);

      const scheduledMinutes = getScheduledMinutes(startsAt, endsAt, shift);

      /* -------------------------------------------------------------------- */
      /* Time Logs                                                             */
      /* -------------------------------------------------------------------- */

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

      /* -------------------------------------------------------------------- */
      /* Aggregate Attendance                                                 */
      /* -------------------------------------------------------------------- */

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

      /* -------------------------------------------------------------------- */
      /* Grace / Worked Calculation                                            */
      /* -------------------------------------------------------------------- */

      /**
       * Grace is only credited when the employee's first IN
       * falls within the configured grace period.
       *
       * This prevents an otherwise valid 8-hour shift from becoming
       * 7h50 merely because the employee arrived 10 minutes after start.
       */
      workedMinutes = applyGraceToWorkedMinutes(
        workedMinutes,
        firstTimeIn,
        startsAt,
        graceMinutes,
      );

      /* -------------------------------------------------------------------- */
      /* Attendance Metrics                                                    */
      /* -------------------------------------------------------------------- */

      const lateMinutes = calculateLateMinutes(
        firstTimeIn,
        startsAt,
        graceMinutes,
      );

      const overtimeMinutes = calculateOvertimeMinutes(lastTimeOut, endsAt);

      const undertimeMinutes = lastTimeOut
        ? calculateUndertimeMinutes(
            firstTimeIn,
            lastTimeOut,
            startsAt,
            endsAt,
            graceMinutes,
          )
        : 0;

      /* -------------------------------------------------------------------- */
      /* Employee Metadata                                                     */
      /* -------------------------------------------------------------------- */

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

      /* -------------------------------------------------------------------- */
      /* Status                                                                */
      /* -------------------------------------------------------------------- */

      const attendanceStatus = getAttendanceStatus({
        timeIn: firstTimeIn,

        timeOut: lastTimeOut,

        workedMinutes,

        lateMinutes,

        undertimeMinutes,

        overtimeMinutes,
      });

      /* -------------------------------------------------------------------- */
      /* Report Row                                                            */
      /* -------------------------------------------------------------------- */

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

        scheduled_minutes: scheduledMinutes,

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

  /* ------------------------------------------------------------------------ */
  /* Sorting                                                                  */
  /* ------------------------------------------------------------------------ */

  rows.sort((a, b) => {
    if (a.work_date !== b.work_date) {
      return a.work_date.localeCompare(b.work_date);
    }

    return a.employee_name.localeCompare(b.employee_name);
  });

  return rows;
}
