import { useMemo, useState } from "react";

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

import { useAttendanceReport } from "../hooks/useAttendanceReport";

function formatMinutes(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return "00:00";
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function formatTime(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDate(value: string): string {
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

export default function ReportsPage() {
  const { users } = useUsers();

  const [date, setDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [userId, setUserId] = useState("");

  const { rows, loading, error, refresh } = useAttendanceReport({
    date_from: date,
    date_to: date,
    ...(userId
      ? {
          user_id: userId,
        }
      : {}),
  });

  const selectedDateLabel = useMemo(() => {
    return formatDate(date);
  }, [date]);

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
      {/* Report Header / Filters */}
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
      </Box>

      {/* Report Content */}
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

                    <TableCell>{formatTime(row.time_in)}</TableCell>

                    <TableCell>{formatTime(row.time_out)}</TableCell>

                    <TableCell align="right">
                      {formatMinutes(
                        Math.max(
                          0,
                          row.worked_minutes - row.undertime_minutes - row.overtime_minutes,
                        ),
                      )}
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

                    <TableCell>{row.attendance_status}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Refresh */}
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
