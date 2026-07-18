import { Button, Grid, Paper } from "@mui/material";

export default function TimeLogger() {
  const handleAction = (action: string) => {
    console.log(action);

    // TODO:
    // logTime(action)
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
            onClick={() => handleAction("time_in")}
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
            onClick={() => handleAction("time_out")}
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
            onClick={() => handleAction("break_start")}
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
            onClick={() => handleAction("break_end")}
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
            onClick={() => handleAction("lunch_start")}
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
            onClick={() => handleAction("lunch_end")}
          >
            Lunch End
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
}
