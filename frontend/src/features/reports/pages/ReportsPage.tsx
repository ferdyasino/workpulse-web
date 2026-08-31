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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getTodayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,

    year: "numeric",

    month: "2-digit",

    day: "2-digit",
  }).format(new Date());
}

function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "00:00";
  }

  const hours = Math.floor(minutes / 60);

  const remainingMinutes = minutes % 60;

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

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,

    hour: "numeric",

    minute: "2-digit",

    hour12: true,
  }).format(date);
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

  const { rows, breakRows, weeklyRows, loading, error, refresh } = useAttendanceReport({
    date_from: date,

    date_to: tab === 2 ? dateTo : date,

    timezone,

    ...(userId
      ? {
          user_id: userId,
        }
      : {}),
  });

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
          Attendance, breaks, daily worked hours, and weekly hours per agent.
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
            label={tab === 2 ? "Week From" : "Date"}
            type="date"
            value={date}
            onChange={(event) => {
              setDate(event.target.value);
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            sx={{
              minWidth: 190,
            }}
          />

          {tab === 2 && (
            <TextField
              label="Week To"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value);
              }}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              sx={{
                minWidth: 190,
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

          <Tab label="Weekly Hours" />
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
        {/* DAILY ATTENDANCE                                                    */}
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
                  minWidth: 1100,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Agent
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Date
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Shift
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Time In
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Time Out
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Break
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Scheduled
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Worked
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Late
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      OT
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={11}
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
                        colSpan={11}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No attendance records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
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

                        <TableCell>{row.shift_name ?? "—"}</TableCell>

                        <TableCell>{formatTime(row.time_in, timezone)}</TableCell>

                        <TableCell>{formatTime(row.time_out, timezone)}</TableCell>

                        <TableCell align="right">{formatMinutes(row.break_minutes)}</TableCell>

                        <TableCell align="right">{formatMinutes(row.scheduled_minutes)}</TableCell>

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

                        <TableCell align="right">{formatMinutes(row.overtime_minutes)}</TableCell>

                        <TableCell>{row.attendance_status}</TableCell>
                      </TableRow>
                    ))
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
                  minWidth: 900,
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Agent
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Date
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Type
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Break #
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Break In
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Break Out
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Duration
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
                        colSpan={7}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No break records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    breakRows.map((row, index) => (
                      <TableRow
                        key={`${row.user_id}-${row.work_date}-${row.break_type}-${row.break_number}-${index}`}
                        hover
                      >
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

                        <TableCell>{row.break_type}</TableCell>

                        <TableCell>{row.break_type === "LUNCH" ? "—" : row.break_number}</TableCell>

                        <TableCell>{formatTime(row.break_in, timezone)}</TableCell>

                        <TableCell>{formatTime(row.break_out, timezone)}</TableCell>

                        <TableCell align="right">{formatMinutes(row.break_minutes)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* ================================================================== */}
        {/* WEEKLY HOURS                                                        */}
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
              Weekly Hours — {selectedRangeLabel}
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
                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Agent
                    </TableCell>

                    <TableCell
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Week
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Present
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Absent
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Scheduled
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Worked Hours
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Break
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Late
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
                      Undertime
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 700,
                      }}
                    >
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
                        Loading weekly report...
                      </TableCell>
                    </TableRow>
                  ) : weeklyRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        align="center"
                        sx={{
                          py: 5,
                        }}
                      >
                        No weekly records found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    weeklyRows.map((row) => (
                      <TableRow key={`${row.user_id}-${row.week_start}`} hover>
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
                          {formatDate(row.week_start)} – {formatDate(row.week_end)}
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
