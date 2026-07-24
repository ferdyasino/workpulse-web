import { Button, Grid, Paper } from "@mui/material";

import { useSnackbar } from "@/components/ui";
import { useAttendanceContext } from "@/providers/AttendanceProvider";

import type { TimeLogAction } from "../types/attendance.types";

export default function TimeLogger() {
  const { state, logTime, isSubmitting } = useAttendanceContext();
  const snackbar = useSnackbar();

  const handleClick = async (action: TimeLogAction) => {
    if (isSubmitting) {
      return;
    }

    try {
      await logTime(action);

      const messages: Record<TimeLogAction, string> = {
        TIME_IN: "Time In recorded successfully.",
        TIME_OUT: "Time Out recorded successfully.",
        BREAK_START: "Break started.",
        BREAK_END: "Break ended.",
        LUNCH_START: "Lunch started.",
        LUNCH_END: "Lunch ended.",
      };

      snackbar.success(messages[action]);
    } catch (err) {
      snackbar.error(err instanceof Error ? err.message : "Unable to record attendance.");
    }
  };

  const session = state?.current_session;

  const hasActiveSession = !!session && !session.time_out;

  const activeBreak = session?.breaks.at(-1);

  const hasActiveBreak = !!activeBreak && !!activeBreak.in && !activeBreak.out;

  const hasActiveLunch = !!session?.lunch.in && !session.lunch.out;

  const isWorking = hasActiveSession && !hasActiveBreak && !hasActiveLunch;

  const isBreak = hasActiveBreak;

  const isLunch = hasActiveLunch;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="contained"
            color="success"
            size="large"
            disabled={isSubmitting || hasActiveSession}
            onClick={() => void handleClick("TIME_IN")}
          >
            Time In
          </Button>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            size="large"
            disabled={isSubmitting || !hasActiveSession || hasActiveBreak || hasActiveLunch}
            onClick={() => void handleClick("TIME_OUT")}
          >
            Time Out
          </Button>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="contained"
            color="warning"
            size="large"
            disabled={isSubmitting || !isWorking}
            onClick={() => void handleClick("BREAK_START")}
          >
            Break Start
          </Button>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="outlined"
            color="warning"
            size="large"
            disabled={isSubmitting || !isBreak}
            onClick={() => void handleClick("BREAK_END")}
          >
            Break End
          </Button>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="contained"
            color="inherit"
            size="large"
            disabled={isSubmitting || !isWorking}
            onClick={() => void handleClick("LUNCH_START")}
          >
            Lunch Start
          </Button>
        </Grid>

        <Grid size={{ xs: 6 }}>
          <Button
            fullWidth
            variant="contained"
            color="info"
            size="large"
            disabled={isSubmitting || !isLunch}
            onClick={() => void handleClick("LUNCH_END")}
          >
            Lunch End
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
