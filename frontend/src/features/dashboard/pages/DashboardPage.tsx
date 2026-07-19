import { Grid, Box } from "@mui/material";

import ProfileCard from "@/features/dashboard/components/ProfileCard";
import TimeLogger from "@/features/dashboard/components/TimeLogger";
import TodaySummary from "@/features/dashboard/components/TodaySummary";

export default function DashboardPage() {
  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12 }}>
          <ProfileCard />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TimeLogger />
        </Grid>
      </Grid>

      <Box
        sx={{
          display: {
            xs: "block",
            md: "none",
          },
          mt: 3,
        }}
      >
        <TodaySummary />
      </Box>
    </>
  );
}
