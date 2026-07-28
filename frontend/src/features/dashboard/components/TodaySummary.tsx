import { useState } from "react";

import { Button, Paper, Stack, Typography } from "@mui/material";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAttendanceContext } from "@/features/dashboard/context/AttendanceContext";
import { useSettingsContext } from "@/features/settings/context/SettingsContext";

import { formatTimestamp } from "@/utils/time";

import { useTimelogs } from "../hooks/useTimelogs";

import TimelogsDialog from "./TimelogsDialog";

export default function TodaySummary() {
  const { state } = useAttendanceContext();

  const { user } = useAuth();

  const { settings } = useSettingsContext();

  const [timelogsOpen, setTimelogsOpen] = useState(false);

  const locale = settings?.locale ?? "en-US";

  /**
   * Temporary:
   * Workspace TIME_FORMAT setting not implemented yet.
   * Change to settings?.time_format once added.
   */
  const timeFormat: "12h" | "24h" = "12h";

  /**
   * Attendance timezone priority:
   * 1. Resolved shift timezone from attendance state
   * 2. User assigned shift timezone
   * 3. Browser timezone fallback
   */
  // const shift = state?.shift ?? user?.shift ?? null;

  const timezone =
    state?.shift?.timezone ??
    user?.shift?.timezone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone;

  const {
    timelogs,
    loading,
    refresh: refreshTimelogs,
  } = useTimelogs({
    workspace_id: user?.workspace_id ?? "",
    user_id: user?.user_id ?? "",
  });

  const session = state?.current_session;

  const activeBreak = session?.breaks.at(-1);

  return (
    <>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        Today Summary
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
        }}
      >
        <Stack spacing={1}>
          <Typography>
            Status: <strong>{state?.status ?? "OFF"}</strong>
          </Typography>

          <Typography>
            Work Date: <strong>{state?.work_date ?? "--"}</strong>
          </Typography>

          <Typography>
            Time In:{" "}
            <strong>{formatTimestamp(session?.time_in, timezone, locale, timeFormat)}</strong>
          </Typography>

          <Typography>
            Time Out:{" "}
            <strong>{formatTimestamp(session?.time_out, timezone, locale, timeFormat)}</strong>
          </Typography>

          <Typography>
            Breaks: <strong>{session?.breaks.length ?? 0}</strong>
          </Typography>

          <Typography>
            Current Break:{" "}
            <strong>
              {activeBreak && !activeBreak.out
                ? formatTimestamp(activeBreak.in, timezone, locale, timeFormat)
                : "None"}
            </strong>
          </Typography>

          <Typography>
            Lunch:{" "}
            <strong>
              {!session?.lunch.in ? "Not started" : session.lunch.out ? "Completed" : "Active"}
            </strong>
          </Typography>

          <Typography>
            Sessions Today: <strong>{state?.sessions.length ?? 0}</strong>
          </Typography>

          <Button
            variant="outlined"
            sx={{
              mt: 2,
              alignSelf: "flex-start",
            }}
            disabled={loading}
            onClick={async () => {
              await refreshTimelogs();
              setTimelogsOpen(true);
            }}
          >
            {loading ? "Loading..." : "View Timelogs"}
          </Button>
        </Stack>
      </Paper>

      <TimelogsDialog
        open={timelogsOpen}
        onClose={() => setTimelogsOpen(false)}
        timelogs={timelogs}
      />
    </>
  );
}
