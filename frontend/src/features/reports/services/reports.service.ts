import { apiRequest } from "@/utils/api";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
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

  worked_minutes: number;

  late_minutes: number;

  undertime_minutes: number;

  overtime_minutes: number;

  attendance_status: string;

  timezone: string;
};

export type AttendanceReportRequest = {
  workspace_id: string;

  date_from: string;

  date_to: string;

  user_id?: string;

  department_id?: string;

  timezone?: string;
};

/* -------------------------------------------------------------------------- */
/* Responses                                                                  */
/* -------------------------------------------------------------------------- */

type AttendanceReportResponse = {
  success: boolean;

  message?: string;

  rows?: AttendanceReportRow[];
};

/* -------------------------------------------------------------------------- */
/* Attendance Report                                                          */
/* -------------------------------------------------------------------------- */

export async function getAttendanceReport(
  payload: AttendanceReportRequest,
): Promise<AttendanceReportRow[]> {
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

  return response.rows ?? [];
}
