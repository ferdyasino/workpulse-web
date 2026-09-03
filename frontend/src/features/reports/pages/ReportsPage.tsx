import { useEffect, useMemo, useState } from "react";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { useUsers } from "@/features/admin/hooks/useUsers";
import { useSettingsContext } from "@/features/settings/context/SettingsContext";

import { useAttendanceReport } from "../hooks/useAttendanceReport";

import type { ReportType } from "../services/reports.service";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getTodayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function formatMinutes(minutes: number | null | undefined): string {
  const value = Number(minutes ?? 0);

  if (!Number.isFinite(value) || value <= 0) {
    return "00:00";
  }

  const normalizedMinutes = Math.floor(value);

  const hours = Math.floor(normalizedMinutes / 60);
  const remainingMinutes = normalizedMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function formatTime(value: string | null, timezone: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch {
    return "—";
  }
}

function formatDate(value: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Shift start/end returned by the backend are local wall-clock values such as:
 *
 *   "08:00"
 *   "16:00"
 *
 * These are intentionally NOT timezone converted because they represent
 * the configured shift schedule rather than UTC attendance timestamps.
 */
function formatShiftTime(value: string | null): string {
  if (!value) {
    return "";
  }

  const match = value.match(/^(\d{1,2}):(\d{2})/);

  if (!match) {
    return value;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return value;
  }

  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

/**
 * The current report service type may not yet contain the new shift time
 * fields. Keep the page compatible until reports.service.ts is updated.
 */
type ReportRowWithShiftTimes = {
  shift_start_time?: string | null;
  shift_end_time?: string | null;
};

function getShiftSchedule(row: ReportRowWithShiftTimes): string | null {
  const start = formatShiftTime(row.shift_start_time ?? null);
  const end = formatShiftTime(row.shift_end_time ?? null);

  if (!start || !end) {
    return null;
  }

  return `${start} – ${end}`;
}

/**
 * Return the Monday of the week containing the supplied date.
 *
 * This is only used by the "This Week" convenience action.
 * The actual Range Hours report does NOT depend on this.
 */
function getMonday(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = date.getDay();

  // Sunday = 0, Monday = 1
  const difference = day === 0 ? -6 : 1 - day;

  date.setDate(date.getDate() + difference);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Return the Sunday of the week containing the supplied date.
 *
 * This is only used by the "This Week" convenience action.
 */
function getSunday(value: string): string {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = date.getDay();

  // Sunday = 0
  const difference = day === 0 ? 0 : 7 - day;

  date.setDate(date.getDate() + difference);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/* -------------------------------------------------------------------------- */
/* Range Hours                                                                */
/* -------------------------------------------------------------------------- */

type RangeHoursRow = {
  user_id: string;
  employee_name: string;
  employee_no: string;

  range_start: string;
  range_end: string;

  days_present: number;
  days_absent: number;

  total_scheduled_minutes: number;
  total_worked_minutes: number;
  total_break_minutes: number;
  total_late_minutes: number;
  total_undertime_minutes: number;
  total_overtime_minutes: number;
};

/**
 * Range Hours is intentionally derived from DAILY rows.
 *
 * This prevents the frontend from depending on a legacy WEEKLY aggregation
 * that may automatically expand the selected range to seven days.
 *
 * Important:
 *
 *   - Only rows returned by the selected date_from/date_to range are counted.
 *   - ABSENT is counted only when the backend actually returns an ABSENT row.
 *   - Days with no scheduled/work hours and no timelogs do not become absent.
 */
function buildRangeHoursRows(
  rows: Array<{
    user_id: string;
    employee_name: string;
    employee_no: string;
    work_date: string;

    scheduled_minutes?: number | null;
    worked_minutes?: number | null;
    break_minutes?: number | null;
    late_minutes?: number | null;
    undertime_minutes?: number | null;
    overtime_minutes?: number | null;

    attendance_status?: string | null;
  }>,
  dateFrom: string,
  dateTo: string,
): RangeHoursRow[] {
  if (!dateFrom || !dateTo || !rows.length) {
    return [];
  }

  const grouped = new Map<string, RangeHoursRow>();

  for (const row of rows) {
    const userId = row.user_id;

    const existing = grouped.get(userId);

    const status = String(row.attendance_status ?? "").toUpperCase();

    const scheduledMinutes = Number(row.scheduled_minutes ?? 0);
    const workedMinutes = Number(row.worked_minutes ?? 0);
    const breakMinutes = Number(row.break_minutes ?? 0);
    const lateMinutes = Number(row.late_minutes ?? 0);
    const undertimeMinutes = Number(row.undertime_minutes ?? 0);
    const overtimeMinutes = Number(row.overtime_minutes ?? 0);

    /*
     * Attendance status rules:
     *
     * Any actual attendance is considered a present day.
     *
     * IN_PROGRESS / INCOMPLETE / PRESENT / LATE / UNDERTIME /
     * LATE_UNDERTIME / OVERTIME / LATE_OVERTIME
     *
     * are all attendance days rather than absent days.
     */
    const hasAttendance =
      status !== "ABSENT" &&
      (Boolean(row.work_date) || workedMinutes > 0 || lateMinutes > 0 || overtimeMinutes > 0);

    const isAbsent = status === "ABSENT";

    if (!existing) {
      grouped.set(userId, {
        user_id: userId,
        employee_name: row.employee_name,
        employee_no: row.employee_no,

        range_start: dateFrom,
        range_end: dateTo,

        days_present: hasAttendance ? 1 : 0,
        days_absent: isAbsent ? 1 : 0,

        total_scheduled_minutes: Math.max(0, scheduledMinutes),
        total_worked_minutes: Math.max(0, workedMinutes),
        total_break_minutes: Math.max(0, breakMinutes),
        total_late_minutes: Math.max(0, lateMinutes),
        total_undertime_minutes: Math.max(0, undertimeMinutes),
        total_overtime_minutes: Math.max(0, overtimeMinutes),
      });

      continue;
    }

    if (hasAttendance) {
      existing.days_present += 1;
    }

    if (isAbsent) {
      existing.days_absent += 1;
    }

    existing.total_scheduled_minutes += Math.max(0, scheduledMinutes);
    existing.total_worked_minutes += Math.max(0, workedMinutes);
    existing.total_break_minutes += Math.max(0, breakMinutes);
    existing.total_late_minutes += Math.max(0, lateMinutes);
    existing.total_undertime_minutes += Math.max(0, undertimeMinutes);
    existing.total_overtime_minutes += Math.max(0, overtimeMinutes);
  }

  return Array.from(grouped.values()).sort((a, b) =>
    a.employee_name.localeCompare(b.employee_name),
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ReportsPage() {
  const { users } = useUsers();

  const { settings, loading: settingsLoading } = useSettingsContext();

  const timezone = settings?.timezone ?? "Asia/Manila";

  const [date, setDate] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [userId, setUserId] = useState("");

  const [tab, setTab] = useState(0);

  /* ------------------------------------------------------------------------ */
  /* Report type                                                              */
  /* ------------------------------------------------------------------------ */

  /**
   * The backend can continue returning WEEKLY for compatibility.
   *
   * The UI no longer relies on weeklyRows for the Range Hours display.
   * Range Hours are calculated from the daily rows below.
   */
  const reportType: ReportType = useMemo(() => {
    switch (tab) {
      case 1:
        return "BREAK";

      case 2:
        return "WEEKLY";

      case 0:
      default:
        return "DAILY";
    }
  }, [tab]);

  /* ------------------------------------------------------------------------ */
  /* Initialize dates                                                         */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!settings?.timezone) {
      return;
    }

    const today = getTodayInTimezone(settings.timezone);

    setDate((current) => current || today);
    setDateTo((current) => current || today);
  }, [settings?.timezone]);

  /* ------------------------------------------------------------------------ */
  /* Report                                                                    */
  /* ------------------------------------------------------------------------ */

  const { rows, breakRows, loading, error, refresh } = useAttendanceReport({
    date_from: date,
    date_to: tab === 2 ? dateTo : date,
    timezone,
    report_type: reportType,

    ...(userId
      ? {
          user_id: userId,
        }
      : {}),
  });

  /* ------------------------------------------------------------------------ */
  /* Range Hours                                                              */
  /* ------------------------------------------------------------------------ */

  const rangeRows = useMemo(() => {
    if (tab !== 2) {
      return [];
    }

    return buildRangeHoursRows(rows, date, dateTo);
  }, [rows, date, dateTo, tab]);

  /* ------------------------------------------------------------------------ */
  /* Labels                                                                    */
  /* ------------------------------------------------------------------------ */

  const selectedDateLabel = useMemo(() => {
    return date ? formatDate(date) : "—";
  }, [date]);

  const selectedRangeLabel = useMemo(() => {
    if (!date || !dateTo) {
      return "—";
    }

    return `${formatDate(date)} – ${formatDate(dateTo)}`;
  }, [date, dateTo]);

  /* ------------------------------------------------------------------------ */
  /* Settings Loading                                                         */
  /* ------------------------------------------------------------------------ */

  if (settingsLoading && !settings) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          minWidth: 0,
          borderRadius: 2,
          p: 4,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Attendance Reports
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Loading workspace settings...
        </Typography>
      </Paper>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Render                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        minWidth: 0,
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                             */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          px: 4,
          pt: 4,
          pb: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            mb: 1,
          }}
        >
          Attendance Reports
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 3,
          }}
        >
          Attendance, breaks, daily worked hours, and range hours per agent.
        </Typography>

        {/* -------------------------------------------------------------- */}
        {/* Filters                                                         */}
        {/* -------------------------------------------------------------- */}

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
            mb: 3,
          }}
        >
          <TextField
            label={tab === 2 ? "Date From" : "Date"}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);

              if (tab === 2 && dateTo && event.target.value > dateTo) {
                setDateTo(event.target.value);
              }
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
              htmlInput: {
                max: getTodayInTimezone(timezone),
              },
            }}
            sx={{
              minWidth: 180,
            }}
          />

          {tab === 2 && (
            <TextField
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
                htmlInput: {
                  min: date,
                  max: getTodayInTimezone(timezone),
                },
              }}
              sx={{
                minWidth: 180,
              }}
            />
          )}

          <FormControl
            sx={{
              minWidth: 220,
            }}
          >
            <InputLabel id="report-agent-label">Agent</InputLabel>

            <Select
              labelId="report-agent-label"
              value={userId}
              label="Agent"
              onChange={(event) => {
                setUserId(event.target.value);
              }}
            >
              <MenuItem value="">All Agents</MenuItem>

              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.display_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {tab === 2 && (
            <Box
              component="button"
              type="button"
              onClick={() => {
                if (!date) {
                  return;
                }

                setDate(getMonday(date));
                setDateTo(getSunday(date));
              }}
              sx={{
                minHeight: 40,
                px: 2,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                backgroundColor: "transparent",
                color: "text.primary",
                cursor: "pointer",
                font: "inherit",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              This Week
            </Box>
          )}
        </Box>

        {/* -------------------------------------------------------------- */}
        {/* Tabs                                                            */}
        {/* -------------------------------------------------------------- */}

        <Tabs
          value={tab}
          onChange={(_event, value) => {
            setTab(value);
          }}
        >
          <Tab label="Daily Attendance" />

          <Tab label="Breaks" />

          <Tab label="Range Hours" />
        </Tabs>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* Content                                                            */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          p: 4,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {error && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              borderRadius: 1,
              backgroundColor: "error.lighter",
              color: "error.main",
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        {/* ================================================================== */}
        {/* DAILY ATTENDANCE                                                   */}
        {/* ================================================================== */}

        {tab === 0 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Daily Report — {selectedDateLabel}
            </Typography>

            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 1200,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Shift</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Time In</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Time Out</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Break
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Scheduled
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Worked
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Late
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Undertime
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      OT
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        Loading attendance report...
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={12}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const rowTimezone = row.timezone || timezone;

                      const shiftRow = row as typeof row & ReportRowWithShiftTimes;

                      const shiftSchedule = getShiftSchedule(shiftRow);

                      return (
                        <TableRow key={`${row.user_id}-${row.work_date}`} hover>
                          <TableCell>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                }}
                              >
                                {row.employee_name}
                              </Typography>

                              <Typography variant="caption" color="text.secondary">
                                {row.employee_no}
                              </Typography>
                            </Box>
                          </TableCell>

                          <TableCell>{formatDate(row.work_date)}</TableCell>

                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                minWidth: 150,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  lineHeight: 1.3,
                                }}
                              >
                                {row.shift_name ?? "—"}
                              </Typography>

                              {shiftSchedule && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    mt: 0.25,
                                    lineHeight: 1.3,
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {shiftSchedule}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>{formatTime(row.time_in, rowTimezone)}</TableCell>

                          <TableCell>{formatTime(row.time_out, rowTimezone)}</TableCell>

                          <TableCell align="right">{formatMinutes(row.break_minutes)}</TableCell>

                          <TableCell align="right">
                            {formatMinutes(row.scheduled_minutes)}
                          </TableCell>

                          <TableCell align="right">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {formatMinutes(row.worked_minutes)}
                            </Typography>
                          </TableCell>

                          <TableCell align="right">{formatMinutes(row.late_minutes)}</TableCell>

                          <TableCell align="right">
                            {formatMinutes(row.undertime_minutes)}
                          </TableCell>

                          <TableCell align="right">{formatMinutes(row.overtime_minutes)}</TableCell>

                          <TableCell>{row.attendance_status}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* ================================================================== */}
        {/* BREAK REPORT                                                       */}
        {/* ================================================================== */}

        {tab === 1 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Break Report — {selectedDateLabel}
            </Typography>

            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 700,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Break In</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Break Out</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Duration
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        Loading break report...
                      </TableCell>
                    </TableRow>
                  ) : breakRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No break records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (() => {
                      const grouped = new Map<
                        string,
                        {
                          employee_name: string;
                          employee_no: string;
                          rows: typeof breakRows;
                          total_minutes: number;
                        }
                      >();

                      for (const row of breakRows) {
                        const key = row.user_id;

                        const existing = grouped.get(key);

                        if (existing) {
                          existing.rows.push(row);

                          existing.total_minutes += row.break_minutes ?? 0;
                        } else {
                          grouped.set(key, {
                            employee_name: row.employee_name,
                            employee_no: row.employee_no,
                            rows: [row],
                            total_minutes: row.break_minutes ?? 0,
                          });
                        }
                      }

                      return Array.from(grouped.values()).flatMap((group) => {
                        const result: React.ReactNode[] = [];

                        group.rows.forEach((row, index) => {
                          const rowTimezone = row.timezone || timezone;

                          const typeLabel =
                            row.break_type === "LUNCH"
                              ? "Lunch"
                              : `Break ${row.break_number ?? index + 1}`;

                          result.push(
                            <TableRow
                              key={`${row.user_id}-${row.work_date}-${row.break_type}-${row.break_number}-${index}`}
                              hover
                            >
                              <TableCell>
                                {index === 0 ? (
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                      }}
                                    >
                                      {group.employee_name}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary">
                                      {group.employee_no}
                                    </Typography>
                                  </Box>
                                ) : (
                                  ""
                                )}
                              </TableCell>

                              <TableCell>{typeLabel}</TableCell>

                              <TableCell>{formatTime(row.break_in, rowTimezone)}</TableCell>

                              <TableCell>{formatTime(row.break_out, rowTimezone)}</TableCell>

                              <TableCell align="right">
                                {formatMinutes(row.break_minutes)}
                              </TableCell>
                            </TableRow>,
                          );
                        });

                        result.push(
                          <TableRow
                            key={`${group.rows[0]?.user_id}-${group.rows[0]?.work_date}-total`}
                          >
                            <TableCell />

                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                }}
                              >
                                Total
                              </Typography>
                            </TableCell>

                            <TableCell />

                            <TableCell />

                            <TableCell align="right">
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 700,
                                }}
                              >
                                {formatMinutes(group.total_minutes)}
                              </Typography>
                            </TableCell>
                          </TableRow>,
                        );

                        return result;
                      });
                    })()
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* ================================================================== */}
        {/* RANGE HOURS                                                        */}
        {/* ================================================================== */}

        {tab === 2 && (
          <>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                mb: 2,
              }}
            >
              Range Hours — {selectedRangeLabel}
            </Typography>

            <TableContainer
              sx={{
                width: "100%",
                overflowX: "auto",
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Table
                size="small"
                sx={{
                  minWidth: 1100,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>Range</TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Present
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Absent
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Scheduled
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Worked Hours
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Break
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Late
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Undertime
                    </TableCell>

                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Overtime
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        Loading range report...
                      </TableCell>
                    </TableRow>
                  ) : rangeRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No range records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rangeRows.map((row) => (
                      <TableRow key={row.user_id} hover>
                        <TableCell>
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                              }}
                            >
                              {row.employee_name}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                              {row.employee_no}
                            </Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {formatDate(row.range_start)} – {formatDate(row.range_end)}
                        </TableCell>

                        <TableCell align="right">{row.days_present}</TableCell>

                        <TableCell align="right">{row.days_absent}</TableCell>

                        <TableCell align="right">
                          {formatMinutes(row.total_scheduled_minutes)}
                        </TableCell>

                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                            }}
                          >
                            {formatMinutes(row.total_worked_minutes)}
                          </Typography>
                        </TableCell>

                        <TableCell align="right">
                          {formatMinutes(row.total_break_minutes)}
                        </TableCell>

                        <TableCell align="right">{formatMinutes(row.total_late_minutes)}</TableCell>

                        <TableCell align="right">
                          {formatMinutes(row.total_undertime_minutes)}
                        </TableCell>

                        <TableCell align="right">
                          {formatMinutes(row.total_overtime_minutes)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Refresh                                                            */}
        {/* ------------------------------------------------------------------ */}

        {!loading && (
          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Typography
              component="button"
              variant="body2"
              onClick={() => {
                void refresh();
              }}
              sx={{
                border: 0,
                background: "none",
                cursor: "pointer",
                color: "primary.main",
                font: "inherit",
                p: 0,
              }}
            >
              Refresh report
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}
