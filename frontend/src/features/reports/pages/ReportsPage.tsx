import { useEffect, useMemo, useState } from "react";

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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
/* Date / Time Helpers                                                        */
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

  /*
   * Workspace settings are authoritative.
   *
   * Keep a safe fallback while settings are loading so Intl.DateTimeFormat
   * always receives a valid timezone.
   */
  const timezone = settings?.timezone || "Asia/Manila";

  const [date, setDate] = useState("");
  const [userId, setUserId] = useState("");

  /* ------------------------------------------------------------------------ */
  /* Initialize report date using workspace timezone                          */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!settings?.timezone) {
      return;
    }

    setDate((current) => {
      if (current) {
        return current;
      }

      return getTodayInTimezone(settings.timezone);
    });
  }, [settings?.timezone]);

  /* ------------------------------------------------------------------------ */
  /* Attendance Report                                                        */
  /* ------------------------------------------------------------------------ */

  const { rows, loading, error, refresh } = useAttendanceReport({
    date_from: date,
    date_to: date,
    timezone,
    ...(userId
      ? {
          user_id: userId,
        }
      : {}),
  });

  /* ------------------------------------------------------------------------ */
  /* Selected Date Label                                                      */
  /* ------------------------------------------------------------------------ */

  const selectedDateLabel = useMemo(() => {
    if (!date) {
      return "—";
    }

    return formatDate(date);
  }, [date]);

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
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
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
      {/* Report Header / Filters                                             */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          px: 4,
          pt: 4,
          pb: 3,
          backgroundColor: "background.paper",
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
          Daily attendance report per agent.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "center",
          }}
        >
          {/* -------------------------------------------------------------- */}
          {/* Date                                                             */}
          {/* -------------------------------------------------------------- */}

          <TextField
            label="Date"
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

          {/* -------------------------------------------------------------- */}
          {/* Agent                                                            */}
          {/* -------------------------------------------------------------- */}

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
        {/* Active Timezone                                                 */}
        {/* -------------------------------------------------------------- */}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            mt: 2,
          }}
        >
          Report timezone: {timezone}
        </Typography>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* Report Content                                                      */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          p: 4,
          width: "100%",
          minWidth: 0,
          overflow: "hidden",
        }}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Error                                                             */}
        {/* ---------------------------------------------------------------- */}

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

        {/* ---------------------------------------------------------------- */}
        {/* Report Title                                                      */}
        {/* ---------------------------------------------------------------- */}

        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            mb: 2,
          }}
        >
          Daily Report — {selectedDateLabel}
        </Typography>

        {/* ---------------------------------------------------------------- */}
        {/* Table                                                             */}
        {/* ---------------------------------------------------------------- */}

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
                <TableCell sx={{ fontWeight: 700 }}>Agent</TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Time In</TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Time Out</TableCell>

                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Break
                </TableCell>

                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  Worked Hours
                </TableCell>

                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {/* ---------------------------------------------------------- */}
              {/* Loading                                                       */}
              {/* ---------------------------------------------------------- */}

              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Loading attendance report...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                /* -------------------------------------------------------- */
                /* Empty                                                       */
                /* -------------------------------------------------------- */

                <TableRow>
                  <TableCell
                    colSpan={7}
                    align="center"
                    sx={{
                      py: 5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No attendance records found for {selectedDateLabel}.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                /* -------------------------------------------------------- */
                /* Rows                                                        */
                /* -------------------------------------------------------- */

                rows.map((row) => (
                  <TableRow key={`${row.user_id}-${row.work_date}`} hover>
                    {/* -------------------------------------------------- */}
                    {/* Agent                                                  */}
                    {/* -------------------------------------------------- */}

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

                    {/* -------------------------------------------------- */}
                    {/* Work Date                                              */}
                    {/* -------------------------------------------------- */}

                    <TableCell>{formatDate(row.work_date)}</TableCell>

                    {/* -------------------------------------------------- */}
                    {/* Time In                                                */}
                    {/* -------------------------------------------------- */}

                    <TableCell>{formatTime(row.time_in, timezone)}</TableCell>

                    {/* -------------------------------------------------- */}
                    {/* Time Out                                               */}
                    {/* -------------------------------------------------- */}

                    <TableCell>{formatTime(row.time_out, timezone)}</TableCell>

                    {/* -------------------------------------------------- */}
                    {/* Break                                                  */}
                    {/* -------------------------------------------------- */}

                    <TableCell align="right">
                      {formatMinutes(
                        Math.max(
                          0,
                          row.worked_minutes - row.undertime_minutes - row.overtime_minutes,
                        ),
                      )}
                    </TableCell>

                    {/* -------------------------------------------------- */}
                    {/* Worked Hours                                           */}
                    {/* -------------------------------------------------- */}

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

                    {/* -------------------------------------------------- */}
                    {/* Status                                                 */}
                    {/* -------------------------------------------------- */}

                    <TableCell>{row.attendance_status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ---------------------------------------------------------------- */}
        {/* Refresh                                                           */}
        {/* ---------------------------------------------------------------- */}

        {!loading && rows.length > 0 && (
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
