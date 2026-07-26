import { useState } from "react";

import { Button, Paper, Stack, Typography } from "@mui/material";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useAttendanceContext } from "@/features/dashboard/context/AttendanceContext";

import { useTimelogs } from "../hooks/useTimelogs";

import TimelogsDialog from "./TimelogsDialog";

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TodaySummary() {
  const { state } = useAttendanceContext();
  const { user } = useAuth();

  const [timelogsOpen, setTimelogsOpen] = useState(false);

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

          <Typography>Work Date: {state?.work_date ?? "--"}</Typography>

          <Typography>Time In: {formatTime(session?.time_in)}</Typography>

          <Typography>Time Out: {formatTime(session?.time_out)}</Typography>

          <Typography>Breaks: {session?.breaks.length ?? 0}</Typography>

          <Typography>
            Current Break: {activeBreak && !activeBreak.out ? formatTime(activeBreak.in) : "None"}
          </Typography>

          <Typography>
            Lunch: {!session?.lunch.in ? "Not started" : session.lunch.out ? "Completed" : "Active"}
          </Typography>

          <Typography>Sessions Today: {state?.sessions.length ?? 0}</Typography>

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
