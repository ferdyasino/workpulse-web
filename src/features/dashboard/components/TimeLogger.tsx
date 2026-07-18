import { useCallback } from "react";

import { Button, Grid, Paper } from "@mui/material";

import { useAttendance } from "../hooks/useAttendance";

export default function TimeLogger() {
  const { logTime, isSubmitting } = useAttendance();

  const handleClick = useCallback(
    (action: Parameters<typeof logTime>[0]) => {
      if (isSubmitting) return;

      void logTime(action);
    },
    [logTime, isSubmitting],
  );

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
            onClick={() => handleClick("time_in")}
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
            onClick={() => handleClick("time_out")}
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
            onClick={() => handleClick("break_start")}
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
            onClick={() => handleClick("break_end")}
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
            onClick={() => handleClick("lunch_start")}
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
            onClick={() => handleClick("lunch_end")}
          >
            Lunch End
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
