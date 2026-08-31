import { useCallback, useEffect, useState } from "react";

import { useWorkspace } from "@/features/workspace/hooks/useWorkspace";

import {
  getAttendanceReport,
  type AttendanceReportRequest,
  type AttendanceReportRow,
  type BreakReportRow,
  type WeeklyReportRow,
  type ReportType,
} from "../services/reports.service";

export function useAttendanceReport(params: {
  date_from: string;
  date_to: string;
  user_id?: string;
  department_id?: string;
  timezone?: string;
  report_type?: ReportType;
}) {
  const { workspace } = useWorkspace();

  const workspaceId = workspace?.id ?? null;

  const [rows, setRows] = useState<AttendanceReportRow[]>([]);
  const [breakRows, setBreakRows] = useState<BreakReportRow[]>([]);
  const [weeklyRows, setWeeklyRows] = useState<WeeklyReportRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (
      !workspaceId ||
      !/^\d{4}-\d{2}-\d{2}$/.test(params.date_from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(params.date_to) ||
      params.date_from > params.date_to
    ) {
      setRows([]);
      setBreakRows([]);
      setWeeklyRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const payload: AttendanceReportRequest = {
        workspace_id: workspaceId,
        date_from: params.date_from,
        date_to: params.date_to,

        ...(params.user_id
          ? {
              user_id: params.user_id,
            }
          : {}),

        ...(params.department_id
          ? {
              department_id: params.department_id,
            }
          : {}),

        ...(params.timezone
          ? {
              timezone: params.timezone,
            }
          : {}),

        ...(params.report_type
          ? {
              report_type: params.report_type,
            }
          : {}),
      };

      const data = await getAttendanceReport(payload);

      setRows(data.rows ?? []);
      setBreakRows(data.break_rows ?? []);
      setWeeklyRows(data.weekly_rows ?? []);
    } catch (err) {
      setRows([]);
      setBreakRows([]);
      setWeeklyRows([]);

      setError(err instanceof Error ? err.message : "Failed to load attendance report");
    } finally {
      setLoading(false);
    }
  }, [
    workspaceId,
    params.date_from,
    params.date_to,
    params.user_id,
    params.department_id,
    params.timezone,
    params.report_type,
  ]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return {
    rows,
    breakRows,
    weeklyRows,
    loading,
    error,
    refresh: loadReport,
  };
}
