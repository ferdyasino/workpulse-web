import { Button, Grid, Paper } from "@mui/material";

import { useAttendance } from "../hooks/useAttendance";

import type { TimeLogAction } from "../types/attendance.types";

export default function TimeLogger() {
  const { logTime, isSubmitting } = useAttendance();

  const handleClick = (action: TimeLogAction) => {
    if (isSubmitting) {
      return;
    }

    void logTime(action);
  };

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
            disabled={isSubmitting}
            onClick={() => handleClick("TIME_IN")}
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
            disabled={isSubmitting}
            onClick={() => handleClick("TIME_OUT")}
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
            disabled={isSubmitting}
            onClick={() => handleClick("BREAK_START")}
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
            disabled={isSubmitting}
            onClick={() => handleClick("BREAK_END")}
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
            disabled={isSubmitting}
            onClick={() => handleClick("LUNCH_START")}
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
            disabled={isSubmitting}
            onClick={() => handleClick("LUNCH_END")}
          >
            Lunch End
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
