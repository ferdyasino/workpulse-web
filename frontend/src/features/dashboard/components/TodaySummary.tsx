import { Paper, Stack, Typography } from "@mui/material";

import { useAttendanceContext } from "@/providers/AttendanceProvider";

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
          background: "rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.12)",
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
        </Stack>
      </Paper>
    </>
  );
}
