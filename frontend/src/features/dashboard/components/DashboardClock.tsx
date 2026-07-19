import { Typography } from "@mui/material";

import { Clock, GlassCard } from "@/components/ui";

export default function DashboardClock() {
  return (
    <GlassCard>
      <Clock />

      <Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary", mt: 2 }}>
        Attendance Clock
      </Typography>
    </GlassCard>
  );
}
