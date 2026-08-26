/* -------------------------------------------------------------------------- */
/* Attendance Report API Types                                                */
/* -------------------------------------------------------------------------- */

export type AttendanceReportRequest = {
  action: "REPORT_ATTENDANCE";

  workspace_id: string;

  date_from: string;

  date_to: string;

  user_id?: string;

  department_id?: string;

  /**
   * Optional display/calculation timezone.
   *
   * If omitted, the employee's resolved shift timezone is used.
   */
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

  worked_minutes: number;

  late_minutes: number;

  undertime_minutes: number;

  overtime_minutes: number;

  attendance_status: string;

  timezone: string;
};

export type AttendanceReportResponse = {
  success: boolean;

  message?: string;

  rows?: AttendanceReportRow[];
};
