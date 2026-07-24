import { Box } from "@mui/material";

import { Clock } from "@/components/ui";
import TodaySummary from "@/features/dashboard/components/TodaySummary";

export default function Sidebar() {
  return (
    <Box
      sx={{
        width: "100%",
        p: 2,
      }}
    >
      <Clock timezone="America/New_York" />

      <Box
        sx={{
          display: {
            xs: "none",
            md: "block",
          },
          mt: 3,
        }}
      >
        <TodaySummary />
      </Box>
    </Box>
  );
}
