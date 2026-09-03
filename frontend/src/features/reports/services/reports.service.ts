import { apiRequest } from "@/utils/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type ReportType = "DAILY" | "BREAK" | "WEEKLY";

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

export type AttendanceReportRequest = {
  workspace_id: string;
  date_from: string;
  date_to: string;

  user_id?: string;
  department_id?: string;
  timezone?: string;
  report_type?: ReportType;
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

/* -------------------------------------------------------------------------- */
/* Attendance Reports                                                         */
/* -------------------------------------------------------------------------- */

export async function getAttendanceReport(
  payload: AttendanceReportRequest,
): Promise<AttendanceReportResponse> {
  const response = await apiRequest<
    AttendanceReportResponse,
    AttendanceReportRequest & {
      action: "REPORT_ATTENDANCE";
    }
  >({
    action: "REPORT_ATTENDANCE",
    ...payload,
  });

  if (!response.success) {
    throw new Error(response.message ?? "Failed to load attendance report");
  }

  return response;
}
