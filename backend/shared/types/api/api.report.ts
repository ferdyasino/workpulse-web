/* -------------------------------------------------------------------------- */
/* Attendance Reports API Types                                               */
/* -------------------------------------------------------------------------- */

export type ReportType = "DAILY" | "BREAK" | "WEEKLY";

export type AttendanceReportRequest = {
  action: "REPORT_ATTENDANCE";

  workspace_id: string;

  date_from: string;

  date_to: string;

  user_id?: string;

  department_id?: string;

  /**
   * Optional report/display timezone.
   *
   * If omitted, the resolved shift timezone is used.
   */
  timezone?: string;

  /**
   * Determines which report dataset should be returned.
   *
   * DAILY  = attendance + daily worked hours
   * BREAK  = break/lunch details
   * WEEKLY = aggregated weekly hours per agent
   */
  report_type?: ReportType;
};

/* -------------------------------------------------------------------------- */
/* Daily Report                                                               */
/* -------------------------------------------------------------------------- */

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

  worked_minutes: number;

  scheduled_minutes: number;

  late_minutes: number;

  undertime_minutes: number;

  overtime_minutes: number;

  attendance_status: string;

  timezone: string;
};

/* -------------------------------------------------------------------------- */
/* Break Report                                                               */
/* -------------------------------------------------------------------------- */

export type BreakReportRow = {
  user_id: string;

  employee_no: string;

  employee_name: string;

  department: string | null;

  work_date: string;

  break_number: number;

  break_type: "BREAK" | "LUNCH";

  break_in: string | null;

  break_out: string | null;

  break_minutes: number;

  timezone: string;
};

/* -------------------------------------------------------------------------- */
/* Weekly Report                                                              */
/* -------------------------------------------------------------------------- */

export type WeeklyReportRow = {
  user_id: string;

  employee_no: string;

  employee_name: string;

  department: string | null;

  week_start: string;

  week_end: string;

  days_present: number;

  days_absent: number;

  total_scheduled_minutes: number;

  total_worked_minutes: number;

  total_break_minutes: number;

  total_late_minutes: number;

  total_undertime_minutes: number;

  total_overtime_minutes: number;

  timezone: string;
};

/* -------------------------------------------------------------------------- */
/* Response                                                                   */
/* -------------------------------------------------------------------------- */

export type AttendanceReportResponse = {
  success: boolean;

  message?: string;

  rows?: AttendanceReportRow[];

  break_rows?: BreakReportRow[];

  weekly_rows?: WeeklyReportRow[];
};
