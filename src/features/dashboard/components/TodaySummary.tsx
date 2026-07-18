import { Paper, Typography } from "@mui/material";

export default function TodaySummary() {
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
        <Typography color="text.secondary">No attendance yet</Typography>
      </Paper>
    </>
  );
}
